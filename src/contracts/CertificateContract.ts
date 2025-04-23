import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, handler: (...args: any[]) => void) => void;
      removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

const contractABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "studentName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "courseName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "completionDate",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "grade",
        "type": "string"
      }
    ],
    "name": "issueCertificate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "getCertificate",
    "outputs": [
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "studentName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "courseName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "completionDate",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "grade",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "student",
        "type": "address"
      }
    ],
    "name": "getStudentCertificates",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "verifyCertificate",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "deleteCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "student",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "CertificateIssued",
    "type": "event"
  }
];

// Update contract address to match Ganache deployment
const contractAddress = "0x148C54B675668f51Aa9b952D9D624e9FE671053B";

interface Certificate {
  student: string;
  studentName: string;
  courseName: string;
  completionDate: string;
  grade: string;
  tokenId: string;
}

class CertificateContract {
  private contract: ethers.Contract | null = null;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private certificates: Map<string, Certificate> = new Map();

  async initialize() {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    // Configure provider for Ganache
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x539' }], // Chain ID 1337 in hex
    }).catch(async (error) => {
      if (error.code === 4902 || error.code === 4001) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x539',
              chainName: 'Ganache',
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['http://127.0.0.1:7545']
            }
          ]
        });
      }
    });

    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    this.provider = new ethers.BrowserProvider(window.ethereum);
    this.signer = await this.provider.getSigner();
    this.contract = new ethers.Contract(contractAddress, contractABI, this.signer);
  }

  async issueCertificate(studentAddress: string, studentName: string, courseName: string, completionDate: string, grade: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.issueCertificate(studentAddress, studentName, courseName, completionDate, grade);
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction receipt:', receipt);
      
      // Look for the event in the logs
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.contract.interface.parseLog({
            topics: log.topics,
            data: log.data
          });
          
          if (parsedLog?.name === 'CertificateIssued') {
            const tokenId = parsedLog.args[2].toString();
            
            // Store the certificate in memory with consistent property names
            const certificate: Certificate = {
              student: studentAddress,
              studentName,
              courseName,
              completionDate,
              grade,
              tokenId
            };
            this.certificates.set(tokenId, certificate);
            
            return tokenId;
          }
        } catch (e) {
          console.log('Error parsing log:', e);
          continue;
        }
      }
      
      throw new Error('Certificate issuance event not found');
    } catch (error) {
      console.error('Error issuing certificate:', error);
      throw error;
    }
  }

  async getCertificate(tokenId: string): Promise<Certificate> {
    // First check our local cache
    const cachedCertificate = this.certificates.get(tokenId);
    if (cachedCertificate) {
      return cachedCertificate;
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const certificate = await this.contract.getCertificate(tokenId);
      const certData: Certificate = {
        student: certificate[0],
        studentName: certificate[1],
        courseName: certificate[2],
        completionDate: certificate[3],
        grade: certificate[4],
        tokenId
      };
      
      // Cache the certificate
      this.certificates.set(tokenId, certData);
      
      return certData;
    } catch (error) {
      console.error('Error getting certificate:', error);
      throw error;
    }
  }

  async getStudentCertificates(studentAddress: string): Promise<string[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tokenIds = await this.contract.getStudentCertificates(studentAddress);
      return tokenIds.map((id: ethers.BigNumberish) => id.toString());
    } catch (error) {
      console.error('Error getting student certificates:', error);
      throw error;
    }
  }

  async verifyCertificate(tokenId: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      return await this.contract.verifyCertificate(tokenId);
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    }
  }

  async getAllCertificates(): Promise<Certificate[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      // First, get all certificates from our local cache
      const cachedCertificates = Array.from(this.certificates.values());
      
      // If we have certificates in cache, return them
      if (cachedCertificates.length > 0) {
        return cachedCertificates;
      }

      // If no certificates in cache, try to get them from the contract
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000); // Look back 1000 blocks, but not before 0

      const recentEvents = await this.contract.queryFilter(
        this.contract.filters.CertificateIssued(),
        fromBlock,
        currentBlock
      );

      const certificates: Certificate[] = [];
      
      for (const event of recentEvents) {
        if ('args' in event && Array.isArray(event.args)) {
          const tokenId = event.args[2]?.toString();
          if (tokenId) {
            try {
              const cert = await this.getCertificate(tokenId);
              certificates.push(cert);
            } catch (e) {
              console.error(`Error fetching certificate ${tokenId}:`, e);
            }
          }
        }
      }

      return certificates;
    } catch (error) {
      console.error('Error getting all certificates:', error);
      throw error;
    }
  }

  async deleteCertificate(tokenId: string): Promise<void> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.deleteCertificate(tokenId);
      console.log('Delete transaction sent:', tx.hash);
      await tx.wait();
      
      // Remove from local cache
      this.certificates.delete(tokenId);
    } catch (error) {
      console.error('Error deleting certificate:', error);
      throw error;
    }
  }
}

export const certificateContract = new CertificateContract();