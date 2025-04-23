import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePDF = async (element: HTMLElement, fileName: string = 'certificate.pdf') => {
  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    useCORS: true
  });
  
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
  pdf.save(fileName);
}; 