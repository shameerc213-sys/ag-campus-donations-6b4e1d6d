import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Render an HTML string as a multi-page A4 PDF.
 * Uses html2canvas so non-Latin scripts (Malayalam etc.) render correctly
 * via the browser's system fonts.
 */
export async function htmlToPdf(html: string, fileName: string) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width @ 96dpi
  container.style.background = '#ffffff';
  container.style.color = '#000000';
  container.style.fontFamily =
    "'Noto Sans Malayalam','Manjari','Meera','Anjali Old Lipi','Segoe UI',sans-serif";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= pageH) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
    } else {
      // Slice the canvas across multiple pages
      const pageCanvasHeightPx = Math.floor((pageH * canvas.width) / pageW);
      let renderedPx = 0;
      while (renderedPx < canvas.height) {
        const sliceH = Math.min(pageCanvasHeightPx, canvas.height - renderedPx);
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = sliceH;
        const ctx = slice.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        const sliceData = slice.toDataURL('image/jpeg', 0.92);
        if (renderedPx > 0) pdf.addPage();
        pdf.addImage(sliceData, 'JPEG', 0, 0, imgW, (sliceH * imgW) / canvas.width);
        renderedPx += sliceH;
      }
    }

    pdf.save(fileName);
  } finally {
    document.body.removeChild(container);
  }
}

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!),
  );
