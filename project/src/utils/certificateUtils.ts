import { keccak256, toUtf8Bytes } from 'ethers';

export const generateCertificateHash = (
  studentAddress: string,  // This can be either student or studentAddress
  studentName: string,
  courseName: string,
  completionDate: string,
  grade: string,
  tokenId: string
): string => {
  // Check for undefined or null values
  if (!studentAddress || !studentName || !courseName || !completionDate || !grade || !tokenId) {
    throw new Error('All certificate fields are required for hash generation');
  }

  try {
    // Ensure consistent data format regardless of property name used
    const data = `${studentAddress.toString().toLowerCase()}-${studentName}-${courseName}-${completionDate}-${grade}-${tokenId}`;
    
    // Generate keccak256 hash and take first 12 characters after '0x'
    const hash = keccak256(toUtf8Bytes(data));
    return hash.slice(0, 14); // Returns '0x' + 10 characters
  } catch (error) {
    console.error('Error generating certificate hash:', error);
    throw new Error('Failed to generate certificate hash. Please ensure all fields are valid.');
  }
}; 