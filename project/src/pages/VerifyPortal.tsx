import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle } from 'lucide-react';
import { certificateContract } from '../contracts/CertificateContract';
import { generateCertificateHash } from '../utils/certificateUtils';
import '../styles/animations.css';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

const VerifyPortal = () => {
  const [certificateHash, setCertificateHash] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    certificate?: {
      studentName: string;
      courseName: string;
      completionDate: string;
      grade: string;
      studentAddress: string;
      tokenId: string;
    };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      await certificateContract.initialize();

      // First try to get all certificates (including cached ones)
      const certificates = await certificateContract.getAllCertificates();
      
      let found = false;
      for (const cert of certificates) {
        try {
          if (!cert.student || !cert.studentName || !cert.courseName || 
              !cert.completionDate || !cert.grade || !cert.tokenId) {
            console.warn('Skipping certificate with missing data:', cert);
            continue;
          }

          const hash = generateCertificateHash(
            cert.student,
            cert.studentName,
            cert.courseName,
            cert.completionDate,
            cert.grade,
            cert.tokenId
          );

          if (hash.toLowerCase() === certificateHash.toLowerCase()) {
            // Verify the certificate on the blockchain
            const isValid = await certificateContract.verifyCertificate(cert.tokenId);
            
            if (isValid) {
              found = true;
              setVerificationResult({
                isValid: true,
                certificate: cert
              });
              break;
            }
          }
        } catch (e) {
          console.error('Error processing certificate:', e);
          continue;
        }
      }

      // If not found in recent certificates, try to get all student certificates
      if (!found) {
        try {
          // Get connected wallet address
          if (!window.ethereum) {
            throw new Error('MetaMask is not installed');
          }

          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0) {
            const studentAddress = accounts[0];
            const tokenIds = await certificateContract.getStudentCertificates(studentAddress);
            
            for (const tokenId of tokenIds) {
              try {
                const cert = await certificateContract.getCertificate(tokenId);
                if (!cert.student || !cert.studentName || !cert.courseName || 
                    !cert.completionDate || !cert.grade || !cert.tokenId) {
                  console.warn('Skipping certificate with missing data:', cert);
                  continue;
                }

                const hash = generateCertificateHash(
                  cert.student,
                  cert.studentName,
                  cert.courseName,
                  cert.completionDate,
                  cert.grade,
                  cert.tokenId
                );

                if (hash.toLowerCase() === certificateHash.toLowerCase()) {
                  // Verify the certificate on the blockchain
                  const isValid = await certificateContract.verifyCertificate(tokenId);
                  
                  if (isValid) {
                    found = true;
                    setVerificationResult({
                      isValid: true,
                      certificate: cert
                    });
                    break;
                  }
                }
              } catch (e) {
                console.error(`Error checking certificate ${tokenId}:`, e);
                continue;
              }
            }
          }
        } catch (e) {
          console.error('Error checking student certificates:', e);
          if (e instanceof Error) {
            setError(e.message);
          }
        }
      }

      if (!found) {
        setVerificationResult({
          isValid: false
        });
      }
    } catch (error: any) {
      console.error('Error verifying certificate:', error);
      setError(error.message || 'Failed to verify certificate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-md p-6 hover-scale">
        <div className="flex items-center justify-center mb-6 animate-slideDown">
          <Shield className="h-12 w-12 text-purple-600 transform transition-transform duration-300 hover:rotate-12" />
          <h2 className="text-2xl font-bold ml-2 text-purple-800">Verify Certificate</h2>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg animate-slideInRight">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4 animate-slideUp">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Hash</label>
            <input
              type="text"
              value={certificateHash}
              onChange={(e) => setCertificateHash(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 input-focus-effect"
              placeholder="Enter certificate hash..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center items-center ${
              isLoading 
                ? 'bg-purple-400 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700 button-transition'
            } text-white px-6 py-3 rounded-lg transition-all duration-300`}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⌛</span>
                Verifying...
              </>
            ) : (
              'Verify Certificate'
            )}
          </button>
        </form>

        {verificationResult && (
          <div className={`mt-6 p-4 rounded-lg animate-slideInRight card-hover ${
            verificationResult.isValid ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className="flex items-center">
              {verificationResult.isValid ? (
                <CheckCircle className="h-8 w-8 text-green-600 mr-3 animate-pulse" />
              ) : (
                <XCircle className="h-8 w-8 text-red-600 mr-3 animate-pulse" />
              )}
              <div>
                <h3 className={`text-lg font-semibold ${
                  verificationResult.isValid ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verificationResult.isValid ? 'Valid Certificate' : 'Invalid Certificate'}
                </h3>
                {verificationResult.isValid && verificationResult.certificate && (
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p className="transition-all hover:text-gray-900">
                      <span className="font-semibold">Student Name:</span> {verificationResult.certificate.studentName}
                    </p>
                    <p className="transition-all hover:text-gray-900">
                      <span className="font-semibold">Course:</span> {verificationResult.certificate.courseName}
                    </p>
                    <p className="transition-all hover:text-gray-900">
                      <span className="font-semibold">Completion Date:</span> {new Date(verificationResult.certificate.completionDate).toLocaleDateString()}
                    </p>
                    <p className="transition-all hover:text-gray-900">
                      <span className="font-semibold">Grade:</span> {verificationResult.certificate.grade}
                    </p>
                    <p className="font-mono transition-all hover:text-gray-900">
                      <span className="font-semibold font-sans">Student Address:</span> {verificationResult.certificate.studentAddress}
                    </p>
                  </div>
                )}
                {!verificationResult.isValid && (
                  <p className="mt-2 text-red-600">
                    The provided certificate hash does not match any valid certificates in our system.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyPortal;