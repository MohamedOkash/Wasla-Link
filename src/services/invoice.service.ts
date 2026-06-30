import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import { Invoice } from '../types/finance.types';

class InvoiceService {
  /**
   * Generates a unique invoice number format.
   */
  generateInvoiceNumber(orderId: string): string {
    if (orderId.includes('-') && !orderId.startsWith('INV-')) {
      return `INV-${orderId}`;
    }
    const cleanId = orderId.replace('ord_', '').replace('O-', '');
    const datePart = new Date().toISOString().split('T')[0].replace(/-/g, '');
    return `INV-${datePart}-${cleanId}`;
  }

  /**
   * Generates a Base64 encoded QR Code data URL.
   */
  async generateQRCode(text: string): Promise<string> {
    try {
      const dataUrl = await QRCode.toDataURL(text, {
        margin: 1,
        width: 150,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      return dataUrl;
    } catch (err) {
      console.error('Failed to generate QR Code', err);
      return '';
    }
  }

  /**
   * Exports an HTML element to a downloadable PDF document using jsPDF & html2canvas.
   */
  async downloadPDF(elementId: string, filename = 'invoice.pdf'): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // higher resolution
        useCORS: true
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Handle multi-page PDFs if invoice overflows
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(filename);
    } catch (err) {
      console.error('Failed to export PDF invoice', err);
      throw err;
    }
  }

  /**
   * Automatically triggers browser print dialog for a specific element.
   */
  printInvoice(elementId: string): void {
    const element = document.getElementById(elementId);
    if (!element) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>WaslaLink Invoice Print</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 20px; direction: rtl; }
            .no-print { display: none; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${element.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}

export const invoiceService = new InvoiceService();
export default invoiceService;
