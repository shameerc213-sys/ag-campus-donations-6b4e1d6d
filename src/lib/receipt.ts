import jsPDF from 'jspdf';
import { supabase } from '@/integrations/supabase/client';
import templateUrl from '@/assets/receipt-template.jpg';

export interface ReceiptData {
  receipt_number: string;
  donor_name: string;
  donor_phone?: string | null;
  donor_address?: string | null;
  amount: number;
  donation_date: string;
  notes?: string | null;
}

interface OrgInfo {
  org_name?: string;
  org_address?: string;
  org_phone?: string;
  org_phone2?: string;
  org_email?: string;
  org_logo_url?: string;
  seal_url?: string;
  signature_url?: string;
}

const cache: { org?: OrgInfo } = {};

export async function loadOrgInfo(force = false): Promise<OrgInfo> {
  if (cache.org && !force) return cache.org;
  const { data } = await supabase.from('organization_settings').select('key, value');
  const obj: Record<string, string> = {};
  (data || []).forEach((r) => {
    if (r.value) obj[r.key] = r.value;
  });
  cache.org = obj as OrgInfo;
  return cache.org;
}

// Indian numbering: amount in words
export function amountInWords(num: number): string {
  if (num === 0) return 'Zero Omani Rial Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const twoDigits = (n: number): string => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
  };
  const threeDigits = (n: number): string => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return (h ? a[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? twoDigits(r) : '');
  };
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 1000);
  let n = rupees;
  let str = '';
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) str += twoDigits(crore) + ' Crore ';
  if (lakh) str += twoDigits(lakh) + ' Lakh ';
  if (thousand) str += twoDigits(thousand) + ' Thousand ';
  if (n) str += threeDigits(n);
  str = str.trim() + ' Omani Riyal';
  if (paise) str += ' and ' + threeDigits(paise) + ' Baisa';
  return str + ' Only';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Draw text and shrink font size if it overflows maxWidth
function drawFit(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  startSize: number,
  weight: string,
  color: string,
  align: CanvasTextAlign = 'left',
) {
  let size = startSize;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  while (size > 14) {
    ctx.font = `${weight} ${size}px Helvetica, Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  ctx.fillText(text, x, y);
}

async function renderReceiptCanvas(r: ReceiptData): Promise<HTMLCanvasElement> {
  const img = await loadImage(templateUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  // Cover dynamic-field areas with white to wipe template values
  // (carefully avoid labels on the left and the green border on the right)
  ctx.fillStyle = '#ffffff';
  // Receipt no value: template's "00012" sits at x~517-652. Cover that area,
  // but stop well before the "Date:" label that starts at x~1023.
  ctx.fillRect(510, 635, 480, 80);
  // Date value: template's "19/05/26" sits at x~1160-1335. "Date:" label ends ~x:1135.
  // Green border is at x~1407, so stop white fill before it.
  ctx.fillRect(1145, 625, 255, 100);
  // Received from value
  ctx.fillRect(705, 775, 650, 90);
  // Amount value
  ctx.fillRect(705, 888, 650, 90);
  // In words value
  ctx.fillRect(705, 1000, 650, 90);

  const dateFmt = new Date(r.donation_date).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
  const amountFmt = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3, maximumFractionDigits: 3,
  }).format(r.amount);

  // Receipt number (red, bold) — aligned where template's "00012" was
  drawFit(ctx, r.receipt_number, 520, 698, 460, 50, '800', '#b91c1c');
  // Date (black) — left-aligned right after "Date:" label, before green border
  drawFit(ctx, dateFmt, 1150, 698, 245, 44, '500', '#111111');
  // Donor name
  drawFit(ctx, r.donor_name, 720, 845, 730, 50, '700', '#111111');
  // Amount (green, bold)
  drawFit(ctx, `${amountFmt} OMR`, 720, 958, 730, 50, '800', '#1b5e20');
  // In words
  drawFit(ctx, amountInWords(r.amount), 720, 1070, 730, 44, '500', '#111111');

  // Organizer signature (right side, above the signature line)
  const org = await loadOrgInfo();
  if (org.signature_url) {
    try {
      const sig = await loadImage(org.signature_url);
      const boxW = 380, boxH = 160;
      const cx = 1100, cy = 1500; // center of signature area, above the line
      const ratio = Math.min(boxW / sig.naturalWidth, boxH / sig.naturalHeight);
      const w = sig.naturalWidth * ratio;
      const h = sig.naturalHeight * ratio;
      ctx.drawImage(sig, cx - w / 2, cy - h, w, h);
    } catch (e) {
      console.warn('signature load failed', e);
    }
  }

  return canvas;
}

export async function generateReceiptPDF(r: ReceiptData): Promise<Blob> {
  await loadOrgInfo();
  const canvas = await renderReceiptCanvas(r);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const ratio = canvas.height / canvas.width;
  const margin = 20;
  let imgW = pageW - margin * 2;
  let imgH = imgW * ratio;
  if (imgH > pageH - margin * 2) {
    imgH = pageH - margin * 2;
    imgW = imgH / ratio;
  }
  pdf.addImage(dataUrl, 'JPEG', (pageW - imgW) / 2, (pageH - imgH) / 2, imgW, imgH, undefined, 'FAST');
  return pdf.output('blob');
}

export async function downloadReceipt(r: ReceiptData) {
  const blob = await generateReceiptPDF(r);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Receipt_${r.receipt_number}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
