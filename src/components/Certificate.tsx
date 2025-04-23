import React from 'react';

interface CertificateProps {
  studentName: string;
  courseName: string;
  completionDate: string;
  grade: string;
  certificateId: string;
  studentAddress: string;
}

const Certificate = React.forwardRef<HTMLDivElement, CertificateProps>(({
  studentName,
  courseName,
  completionDate,
  grade,
  certificateId,
  studentAddress
}, ref) => {
  return (
    <div ref={ref} className="w-[760px] h-[560px] p-7 bg-white border-8 border-blue-800 relative">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/certificate-bg.png')] opacity-10 z-0"></div>
      <div className="relative z-10">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-blue-800 mb-4">Certificate of Completion</h1>
          <div className="text-lg text-gray-600 mb-8">This is to certify that</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{studentName}</h2>
          <div className="text-lg text-gray-600 mb-8">has successfully completed the course</div>
          <h3 className="text-2xl font-bold text-blue-800 mb-8">{courseName}</h3>
          <div className="text-lg text-gray-600 mb-4">with grade: {grade}</div>
          <div className="text-lg text-gray-600 mb-8">on {new Date(completionDate).toLocaleDateString()}</div>
        </div>
        
        <div className="mt-16 flex justify-between items-end">
          <div className="text-left">
            <div className="border-t-2 border-gray-400 pt-2">
              <div className="text-sm text-gray-600">Certificate ID:</div>
              <div className="font-mono text-sm">{certificateId}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="border-t-2 border-gray-400 pt-2">
              <div className="text-sm text-gray-600">Issued to:</div>
              <div className="font-mono text-sm">{studentAddress}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Certificate.displayName = 'Certificate';

export default Certificate; 