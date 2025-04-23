import React, { useState, useEffect, useRef } from 'react';
import { Award, Upload, Download, History } from 'lucide-react';
import { certificateContract } from '../contracts/CertificateContract';
import Certificate from '../components/Certificate';
import { generatePDF } from '../utils/pdfGenerator';
import { generateCertificateHash } from '../utils/certificateUtils';
import '../styles/animations.css';

interface CertificateHistory {
  studentName: string;
  courseName: string;
  completionDate: string;
  grade: string;
  studentAddress: string;
  tokenId: string;
  timestamp?: number;
}

const InstitutePortal = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [studentAddress, setStudentAddress] = useState('');
  const [certificateData, setCertificateData] = useState({
    studentName: '',
    courseName: '',
    completionDate: '',
    grade: ''
  });
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const [lastIssuedCertificate, setLastIssuedCertificate] = useState<CertificateHistory | null>(null);
  const [certificateHistory, setCertificateHistory] = useState<CertificateHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateHistory | null>(null);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await certificateContract.initialize();
          setIsConnected(true);
          fetchCertificateHistory();
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', async (accounts: string[]) => {
        if (accounts.length > 0) {
          setIsConnected(true);
          fetchCertificateHistory();
        } else {
          setIsConnected(false);
          setCertificateHistory([]);
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  const fetchCertificateHistory = async () => {
    try {
      setLoadingHistory(true);
      setError(null);
      
      // Initialize contract if needed
      try {
        await certificateContract.initialize();
      } catch (error: any) {
        console.error('Error initializing contract:', error);
        throw new Error(`Failed to initialize contract: ${error.message}`);
      }

      console.log('Fetching certificates...');
      const certificates = await certificateContract.getAllCertificates();
      console.log('Fetched certificates:', certificates);
      
      if (!Array.isArray(certificates)) {
        throw new Error('Invalid response from getAllCertificates');
      }
      
      const sortedCertificates = certificates
        .filter(cert => {
          if (!cert.student || !cert.studentName || !cert.courseName || 
              !cert.completionDate || !cert.grade || !cert.tokenId) {
            console.warn('Skipping certificate with missing data:', cert);
            return false;
          }
          return true;
        })
        .map(cert => ({
          studentName: cert.studentName,
          courseName: cert.courseName,
          completionDate: cert.completionDate,
          grade: cert.grade,
          studentAddress: cert.student,
          tokenId: cert.tokenId,
          timestamp: new Date(cert.completionDate).getTime()
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
      
      console.log('Processed certificates:', sortedCertificates);
      setCertificateHistory(sortedCertificates);
    } catch (error: any) {
      console.error('Error fetching certificate history:', error);
      setError(`Failed to fetch certificate history: ${error.message}`);
    } finally {
      setLoadingHistory(false);
    }
  };

  const connectWallet = async () => {
    try {
      setError(null);
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          await certificateContract.initialize();
          setIsConnected(true);
          fetchCertificateHistory(); // Fetch history after connecting
        }
      } else {
        setError('Please install MetaMask to use this feature');
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        setError('You need to connect your wallet to continue. Please try again.');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
      setIsConnected(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const newTokenId = await certificateContract.issueCertificate(
        studentAddress,
        certificateData.studentName,
        certificateData.courseName,
        certificateData.completionDate,
        certificateData.grade
      );
      setTokenId(newTokenId);
      
      const newCertificate = {
        ...certificateData,
        studentAddress,
        tokenId: newTokenId,
        timestamp: Date.now()
      };
      
      // Update both last issued and history
      setLastIssuedCertificate(newCertificate);
      setCertificateHistory(prev => [newCertificate, ...prev]);
      
      // Reset form
      setStudentAddress('');
      setCertificateData({
        studentName: '',
        courseName: '',
        completionDate: '',
        grade: ''
      });
    } catch (error: any) {
      console.error('Error issuing certificate:', error);
      setError(error.message || 'Failed to issue certificate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (certificate: CertificateHistory) => {
    if (certificateRef.current && certificate.tokenId) {
      try {
        const certificateHash = generateCertificateHash(
          certificate.studentAddress,
          certificate.studentName,
          certificate.courseName,
          certificate.completionDate,
          certificate.grade,
          certificate.tokenId
        );
        await generatePDF(
          certificateRef.current,
          `certificate-${certificateHash}.pdf`
        );
      } catch (error: any) {
        console.error('Error generating PDF:', error);
        setError('Failed to generate PDF');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-md p-6 hover-scale">
        <div className="flex items-center justify-center mb-6 animate-slideDown">
          <Award className="h-12 w-12 text-blue-600 transform transition-transform duration-300 hover:rotate-12" />
          <h2 className="text-2xl font-bold ml-2 text-blue-800">Institute Portal</h2>
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
              className="bg-blue-600 text-white px-8 py-4 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-1 transform active:translate-y-0 active:shadow-md button-transition"
            >
              Connect with MetaMask
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4 animate-slideUp">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student Wallet Address</label>
                <input
                  type="text"
                  value={studentAddress}
                  onChange={(e) => setStudentAddress(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 input-focus-effect"
                  placeholder="0x..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student Name</label>
                <input
                  type="text"
                  value={certificateData.studentName}
                  onChange={(e) => setCertificateData({ ...certificateData, studentName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 input-focus-effect"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course Name</label>
                <input
                  type="text"
                  value={certificateData.courseName}
                  onChange={(e) => setCertificateData({ ...certificateData, courseName: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 input-focus-effect"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Completion Date</label>
                <input
                  type="date"
                  value={certificateData.completionDate}
                  onChange={(e) => setCertificateData({ ...certificateData, completionDate: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 input-focus-effect"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                <input
                  type="text"
                  value={certificateData.grade}
                  onChange={(e) => setCertificateData({ ...certificateData, grade: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 input-focus-effect"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center items-center ${
                  isLoading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 button-transition'
                } text-white px-8 py-4 rounded-lg transition-all duration-300`}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⌛</span>
                    Issuing Certificate...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2 transform transition-transform group-hover:rotate-12" />
                    Issue Certificate
                  </>
                )}
              </button>

              {tokenId && lastIssuedCertificate && (
                <div className="mt-4 animate-slideInRight">
                  <div className="p-4 bg-green-50 rounded-lg mb-4 card-hover">
                    <p className="text-green-700">
                      Certificate issued successfully!
                    </p>
                    <p className="text-green-700 mt-2">
                      Certificate Hash: <span className="font-mono select-all hover:text-green-900 transition-colors">{generateCertificateHash(
                        lastIssuedCertificate.studentAddress,
                        lastIssuedCertificate.studentName,
                        lastIssuedCertificate.courseName,
                        lastIssuedCertificate.completionDate,
                        lastIssuedCertificate.grade,
                        tokenId
                      )}</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1 hover:text-gray-900 transition-colors">
                      Click the hash above to select and copy it
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4 mb-4 card-hover">
                    <h3 className="text-lg font-semibold mb-4 text-blue-800">Certificate Preview</h3>
                    <div className="overflow-auto">
                      <Certificate
                        ref={certificateRef}
                        studentName={lastIssuedCertificate.studentName}
                        courseName={lastIssuedCertificate.courseName}
                        completionDate={lastIssuedCertificate.completionDate}
                        grade={lastIssuedCertificate.grade}
                        certificateId={generateCertificateHash(
                          lastIssuedCertificate.studentAddress,
                          lastIssuedCertificate.studentName,
                          lastIssuedCertificate.courseName,
                          lastIssuedCertificate.completionDate,
                          lastIssuedCertificate.grade,
                          tokenId
                        )}
                        studentAddress={lastIssuedCertificate.studentAddress}
                      />
                    </div>
                    <button
                      onClick={() => handleDownload(lastIssuedCertificate)}
                      className="mt-4 flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:bg-blue-700 button-transition"
                    >
                      <Download className="h-5 w-5 mr-2 transform transition-transform group-hover:rotate-12" />
                      Download Certificate
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Certificate History Section */}
            <div className="mt-8 border-t pt-6 animate-slideUp">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <History className="h-6 w-6 text-blue-600 transform transition-transform duration-300 hover:rotate-12 mr-2" />
                  <h3 className="text-xl font-semibold text-blue-800">Certificate History</h3>
                </div>
                <button
                  onClick={fetchCertificateHistory}
                  disabled={loadingHistory}
                  className="flex items-center text-blue-600 hover:text-blue-700 px-4 py-2 border border-blue-600 rounded-lg transition-all duration-300 hover:bg-blue-50 button-transition"
                >
                  <svg
                    className={`h-4 w-4 mr-2 ${loadingHistory ? 'animate-spin' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {loadingHistory ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              
              {loadingHistory ? (
                <div className="text-center text-gray-600 py-8">
                  Loading certificate history...
                </div>
              ) : certificateHistory.length === 0 ? (
                <div className="text-center text-gray-600 py-8">
                  No certificates have been issued yet
                </div>
              ) : (
                <div className="space-y-4">
                  {certificateHistory.map((cert) => (
                    <div key={cert.tokenId} className="border rounded-lg p-4 card-hover">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-blue-800 hover:text-blue-600 transition-colors">
                            {cert.courseName}
                          </h4>
                          <p className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            Issued to: {cert.studentName}
                          </p>
                          <p className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            Grade: {cert.grade}
                          </p>
                          <p className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            Date: {new Date(cert.completionDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600 font-mono select-all hover:text-gray-900 transition-colors">
                            Certificate Hash: {generateCertificateHash(
                              cert.studentAddress,
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
                            className="flex items-center text-blue-600 hover:text-blue-700 px-4 py-2 border border-blue-600 rounded-lg transition-all duration-300 hover:bg-blue-50 button-transition"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => handleDownload(cert)}
                            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:bg-blue-700 button-transition"
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

            {/* Certificate Preview Modal */}
            {selectedCertificate && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
                <div className="bg-white rounded-lg p-6 max-w-4xl w-full flex flex-col items-center hover-scale">
                  <div className="flex justify-between items-center mb-4 w-full">
                    <h3 className="text-xl font-semibold text-blue-800">Certificate Preview</h3>
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
                        selectedCertificate.studentAddress,
                        selectedCertificate.studentName,
                        selectedCertificate.courseName,
                        selectedCertificate.completionDate,
                        selectedCertificate.grade,
                        selectedCertificate.tokenId
                      )}
                      studentAddress={selectedCertificate.studentAddress}
                    />
                  </div>
                  <div className="mt-4 flex justify-end w-full">
                    <button
                      onClick={() => handleDownload(selectedCertificate)}
                      className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg transition-all duration-300 hover:bg-blue-700 button-transition"
                    >
                      <Download className="h-5 w-5 mr-2 transform transition-transform group-hover:rotate-12" />
                      Download Certificate
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InstitutePortal;