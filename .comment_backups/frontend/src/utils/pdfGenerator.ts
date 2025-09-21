import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateQuotationPDF = async (
  elementRef: React.RefObject<HTMLDivElement>,
  filename: string = 'quotation.pdf'
) => {
  if (!elementRef.current) {
    throw new Error('Element reference is null');
  }

  try {
    // Create canvas from HTML element
    const canvas = await html2canvas(elementRef.current, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: elementRef.current.scrollWidth,
      height: elementRef.current.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate PDF dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    // Calculate scaling to fit A4
    const ratio = Math.min(pdfWidth / (canvasWidth * 0.264583), pdfHeight / (canvasHeight * 0.264583));
    
    const imgWidth = canvasWidth * 0.264583 * ratio;
    const imgHeight = canvasHeight * 0.264583 * ratio;
    
    // Center the image on the page
    const x = (pdfWidth - imgWidth) / 2;
    const y = 10; // Small margin from top

    // Add image to PDF
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    
    // Save the PDF
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const printQuotation = (elementRef: React.RefObject<HTMLDivElement>) => {
  if (!elementRef.current) {
    throw new Error('Element reference is null');
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window');
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Quotation</title>
        <meta charset="utf-8">
        <style>
          @page {
            margin: 10mm;
            size: A4;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        </style>
        <link href="https://cdn.tailwindcss.com/2.2.19/tailwind.min.css" rel="stylesheet">
      </head>
      <body>
        ${elementRef.current.outerHTML}
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };
};