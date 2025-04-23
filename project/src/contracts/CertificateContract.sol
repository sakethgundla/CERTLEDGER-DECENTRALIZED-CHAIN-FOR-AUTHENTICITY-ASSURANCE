// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CertificateContract {
    struct Certificate {
        address student;
        string studentName;
        string courseName;
        string completionDate;
        string grade;
        bool exists;
    }

    mapping(uint256 => Certificate) private certificates;
    mapping(address => uint256[]) private studentCertificates;
    uint256 private nextTokenId = 1;

    event CertificateIssued(address indexed issuer, address indexed student, uint256 tokenId);

    function issueCertificate(
        address student,
        string memory studentName,
        string memory courseName,
        string memory completionDate,
        string memory grade
    ) public returns (uint256) {
        require(student != address(0), "Invalid student address");
        
        uint256 tokenId = nextTokenId++;
        certificates[tokenId] = Certificate({
            student: student,
            studentName: studentName,
            courseName: courseName,
            completionDate: completionDate,
            grade: grade,
            exists: true
        });

        studentCertificates[student].push(tokenId);
        emit CertificateIssued(msg.sender, student, tokenId);
        return tokenId;
    }

    function getCertificate(uint256 tokenId) public view returns (
        address student,
        string memory studentName,
        string memory courseName,
        string memory completionDate,
        string memory grade
    ) {
        require(certificates[tokenId].exists, "Certificate does not exist");
        Certificate memory cert = certificates[tokenId];
        return (
            cert.student,
            cert.studentName,
            cert.courseName,
            cert.completionDate,
            cert.grade
        );
    }

    function getStudentCertificates(address student) public view returns (uint256[] memory) {
        return studentCertificates[student];
    }

    function verifyCertificate(uint256 tokenId) public view returns (bool) {
        return certificates[tokenId].exists;
    }
}