import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateDocumentPDF = async (
  elementRef: React.RefObject<HTMLDivElement>,
  filename: string = 'document.pdf'
) => {
  if (!elementRef.current) throw new Error('Element reference is null');

  try {
    const canvas = await html2canvas(elementRef.current, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: elementRef.current.scrollWidth,
      height: elementRef.current.scrollHeight,
    } as any);

    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const ratio = Math.min(
      pdfWidth / (canvasWidth * 0.264583),
      pdfHeight / (canvasHeight * 0.264583)
    );

    const imgWidth = canvasWidth * 0.264583 * ratio;
    const imgHeight = canvasHeight * 0.264583 * ratio;

    const x = (pdfWidth - imgWidth) / 2;
    const y = 10;

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(filename);

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const printDocument = (elementRef: React.RefObject<HTMLDivElement>) => {
  if (!elementRef.current) throw new Error('Element reference is null');

  const printWindow = window.open('', '_blank');
  if (!printWindow) throw new Error('Could not open print window');

  const htmlContent = `<!DOCTYPE html><html><head><title>Document</title><meta charset="utf-8"><style>@page{margin:10mm;size:A4;}body{margin:0;padding:0;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;}*{-webkit-print-color-adjust:exact!important;color-adjust:exact!important;}</style><link href="https://cdn.tailwindcss.com/2.2.19/tailwind.min.css" rel="stylesheet"></head><body>${elementRef.current.outerHTML}</body></html>`;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
};