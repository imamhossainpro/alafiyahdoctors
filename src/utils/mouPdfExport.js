// src/utils/mouPdfExport.js
// ==================================================
// 📄 MoU PDF Export Helpers
// ==================================================
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// ==================================================
// ✅ Element থেকে PNG blob বানান
// ==================================================
const elementToCanvas = async (element, scale = 3) => {
  if (!element) throw new Error('Element not found');

  // ✅ Print/PDF এর সময় button, header ইত্যাদি hide করার helper
  const ignoreElements = (el) => {
    if (!el || !el.classList) return false;
    return (
      el.classList.contains('mou-no-print') ||
      el.classList.contains('mou-no-export')
    );
  };

  // ✅ Body-তে class যোগ — CSS দিয়ে live UI hide হয়
  document.body.classList.add('mou-exporting');

  try {
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      ignoreElements,
    });
    return canvas;
  } finally {
    document.body.classList.remove('mou-exporting');
  }
};

// ==================================================
// ✅ PNG download
// ==================================================
export const downloadMoUAsPNG = async (element, filename = 'MoU.png') => {
  const canvas = await elementToCanvas(element, 3);
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

// ==================================================
// ✅ Multi-page PDF download
// ==================================================
export const downloadMoUAsPDF = async (element, filename = 'MoU.pdf') => {
  const canvas = await elementToCanvas(element, 3);

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();   // 595.28 pt
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 841.89 pt

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pdfHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
  }

  pdf.save(filename);
};

// ==================================================
// ✅ Print helper (uses native print dialog)
// ==================================================
export const printMoU = () => {
  // ✅ Print এর সময় button, header ইত্যাদি hide হবে CSS-এ
  document.body.classList.add('mou-printing');
  setTimeout(() => {
    window.print();
    setTimeout(() => document.body.classList.remove('mou-printing'), 500);
  }, 100);
};

export default {
  downloadMoUAsPNG,
  downloadMoUAsPDF,
  printMoU,
};