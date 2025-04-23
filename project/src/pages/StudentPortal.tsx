import React, { useState, useRef, useEffect } from 'react';
import { Award, Download } from 'lucide-react';
import { certificateContract } from '../contracts/CertificateContract';
import Certificate from '../components/Certificate';
import { generatePDF } from '../utils/pdfGenerator';
import ReactDOM from 'react-dom/client';
import { generateCertificateHash } from '../utils/certificateUtils';
import '../styles/animations.css';

interface CertificateData {
  student: string;
  studentName: string;
  courseName: string;
  completionDate: string;
  grade: string;
  tokenId: string;
}

const StudentPortal = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateData | null>(null);
  const certificateRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const connectWallet = async () => {
    try {
      setError(null);
      if (typeof window.ethereum !== 'undefined') {
        await certificateContract.initialize();
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          fetchCertificates(accounts[0]);
        }
      } else {
        setError('Please install MetaMask to use this feature');
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setError(error.message || 'Failed to connect wallet');
      setIsConnected(false);
    }
  };

  const fetchCertificates = async (address: string) => {
    try {
      setLoading(true);
      setError(null);
      const tokenIds: string[] = await certificateContract.getStudentCertificates(address);
      
      const certificatesData = await Promise.all(
        tokenIds.map(async (tokenId: string) => {
          const cert = await certificateContract.getCertificate(tokenId);
          return {
            ...cert,
            tokenId
          };
        })
      );
      
      setCertificates(certificatesData);
    } catch (error: any) {
      console.error('Error fetching certificates:', error);
      setError(error.message || 'Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificate: CertificateData) => {
    try {
      // Create a temporary div for the certificate
      const tempDiv = document.createElement('div');
      document.body.appendChild(tempDiv);

      // Render the certificate temporarily
      const root = ReactDOM.createRoot(tempDiv);
      await new Promise<void>((resolve) => {
        root.render(
          <Certificate
            studentName={certificate.studentName}
            courseName={certificate.courseName}
            completionDate={certificate.completionDate}
            grade={certificate.grade}
            certificateId={generateCertificateHash(
              certificate.student,
              certificate.studentName,
              certificate.courseName,
              certificate.completionDate,
              certificate.grade,
              certificate.tokenId
            )}
            studentAddress={certificate.student}
          />
        );
        // Wait for the certificate to render
        setTimeout(resolve, 100);
      });

      // Generate PDF with the hash as filename
      const certificateHash = generateCertificateHash(
        certificate.student,
        certificate.studentName,
        certificate.courseName,
        certificate.completionDate,
        certificate.grade,
        certificate.tokenId
      );
      await generatePDF(tempDiv, `certificate-${certificateHash}.pdf`);

      // Clean up
      root.unmount();
      document.body.removeChild(tempDiv);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-md p-6 hover-scale">
        <div className="flex items-center justify-center mb-6 animate-slideDown">
          <Award className="h-12 w-12 text-green-600 transform transition-transform duration-300 hover:rotate-12" />
          <h2 className="text-2xl font-bold ml-2 text-green-800">Student Portal</h2>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg animate-slideInRight">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!isConnected ? (
          <div className="text-center animate-slideUp">
            <button
              onClick={connectWallet}
              className="bg-green-600 text-white px-8 py-4 rounded-lg transition-all duration-300 hover:bg-green-700 hover:shadow-lg hover:-translate-y-1 transform active:translate-y-0 active:shadow-md button-transition"
            >
              Connect with MetaMask
            </button>
          </div>
        ) : (
          <div className="animate-slideUp">
            {certificates.length === 0 ? (
              <div className="text-center text-gray-600 py-8">
                No certificates found in your wallet
              </div>
            ) : (
              <div className="space-y-4">
                {certificates.map((cert) => (
                  <div key={cert.tokenId} className="border rounded-lg p-4 card-hover">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold text-green-800 hover:text-green-600 transition-colors">
                          {cert.courseName}
                        </h4>
                        <p className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                          Grade: {cert.grade}
                        </p>
                        <p className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                          Date: {new Date(cert.completionDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 font-mono select-all hover:text-gray-900 transition-colors">
                          Certificate Hash: {generateCertificateHash(
                            cert.student,
                            cert.studentName,
                            cert.courseName,
                            cert.completionDate,
                            cert.grade,
                            cert.tokenId
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedCertificate(cert)}
                          className="flex items-center text-green-600 hover:text-green-700 px-4 py-2 border border-green-600 rounded-lg transition-all duration-300 hover:bg-green-50 button-transition"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleDownload(cert)}
                          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:bg-green-700 button-transition"
                        >
                          <Download className="h-5 w-5 mr-2 transform transition-transform group-hover:rotate-12" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Certificate Preview Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full flex flex-col items-center hover-scale">
            <div className="flex justify-between items-center mb-4 w-full">
              <h3 className="text-xl font-semibold text-green-800">Certificate Preview</h3>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <Certificate
                studentName={selectedCertificate.studentName}
                courseName={selectedCertificate.courseName}
                completionDate={selectedCertificate.completionDate}
                grade={selectedCertificate.grade}
                certificateId={generateCertificateHash(
                  selectedCertificate.student,
                  selectedCertificate.studentName,
                  selectedCertificate.courseName,
                  selectedCertificate.completionDate,
                  selectedCertificate.grade,
                  selectedCertificate.tokenId
                )}
                studentAddress={selectedCertificate.student}
              />
            </div>
            <div className="mt-4 flex justify-end w-full">
              <button
                onClick={() => handleDownload(selectedCertificate)}
                className="flex items-center bg-green-600 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:bg-green-700 button-transition"
              >
                <Download className="h-5 w-5 mr-2 transform transition-transform group-hover:rotate-12" />
                Download Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPortal;