import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

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
  const paise = Math.round((num - rupees) * 100);
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
  str = str.trim() + ' Omani Rial';
  if (paise) str += ' and ' + twoDigits(paise) + ' Baisa';
  return str + ' Only';
}

function buildReceiptHTML(r: ReceiptData, org: OrgInfo & { org_subtitle?: string; org_initiatives?: string }): string {
  const dateFmt = new Date(r.donation_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  const amountFmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(r.amount);
  const phones = [org.org_phone, org.org_phone2].filter(Boolean).join(', ');
  return `
    <div style="width: 800px; padding: 36px 40px; font-family: 'Helvetica', Arial, sans-serif; color: #1a1a1a; background: #ffffff; box-sizing: border-box;">
      <!-- HEADER: logo left, org info right -->
      <div style="display: flex; align-items: flex-start; gap: 20px;">
        ${org.org_logo_url ? `<img src="${org.org_logo_url}" crossorigin="anonymous" style="height:130px; width:auto; object-fit:contain; flex-shrink:0;"/>` : '<div style="width:130px;"></div>'}
        <div style="flex:1; text-align:center;">
          <div style="font-size: 34px; font-weight: 800; color:#0b6e3a; line-height:1.1;">${escapeHtml(org.org_name || '')}</div>
          ${org.org_subtitle ? `<div style="font-size: 15px; margin-top:8px; color:#222;">${escapeHtml(org.org_subtitle)}</div>` : ''}
          ${org.org_address ? `<div style="font-size: 13px; margin-top:8px; color:#333; white-space: pre-line;">${escapeHtml(org.org_address)}</div>` : ''}
          <div style="font-size: 12px; color:#333; margin-top:8px;">
            ${phones ? 'Ph: ' + escapeHtml(phones) : ''}${org.org_email ? ' &nbsp;|&nbsp; ' + escapeHtml(org.org_email) : ''}
          </div>
        </div>
      </div>

      <!-- RECEIPT BODY inside green rounded box -->
      <div style="margin-top: 18px; border: 2px solid #0b6e3a; border-radius: 16px; padding: 28px 32px;">
        <div style="text-align:center; font-size: 22px; font-weight:700; color:#111; margin-bottom: 22px;">DONATION RECEIPT</div>

        <div style="display:flex; justify-content:space-between; align-items:center; font-size: 16px; margin-bottom: 22px;">
          <div><span style="color:#c0392b; font-weight:700;">Receipt no:</span> <span style="color:#c0392b; font-weight:800;">${escapeHtml(r.receipt_number)}</span></div>
          <div style="color:#222;">Date: ${dateFmt}</div>
        </div>

        <table style="width:100%; font-size: 15px; border-collapse: collapse;">
          <tr>
            <td style="padding:10px 0; width:180px; color:#222;">Recieved from</td>
            <td style="padding:10px 0; font-weight:600;">${escapeHtml(r.donor_name)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; color:#222;">Amount</td>
            <td style="padding:10px 0; font-size:17px; font-weight:700; color:#0b6e3a;">${amountFmt} OMR</td>
          </tr>
          <tr>
            <td style="padding:10px 0; color:#222; vertical-align:top;">In words</td>
            <td style="padding:10px 0;">${amountInWords(r.amount)}</td>
          </tr>
          ${r.notes ? `<tr><td style="padding:10px 0; color:#222;">Notes</td><td style="padding:10px 0;">${escapeHtml(r.notes)}</td></tr>` : ''}
        </table>

        <div style="margin-top: 18px; padding: 14px 16px; background: #eef5ec; font-size: 14px; font-style: italic; color:#222;">
          Thankyou for your generous contribution , May Allah accept your charity and reward you abundantly.
        </div>

        <!-- SEAL + SIGNATURE -->
        <div style="margin-top: 50px; display:flex; justify-content: space-between; align-items: flex-end;">
          <div style="text-align:center; min-width:220px; position:relative;">
            <div style="height:110px; display:flex; align-items:center; justify-content:center;">
              ${org.seal_url ? `<img src="${org.seal_url}" crossorigin="anonymous" style="height:110px; max-width:200px; object-fit:contain; transform: rotate(-18deg); transform-origin: center;"/>` : ''}
            </div>
            <div style="border-top:1px solid #555; margin-top:6px; padding-top:6px; font-size: 14px;">official seal</div>
          </div>
          <div style="text-align:center; min-width:220px;">
            <div style="height:110px; display:flex; align-items:flex-end; justify-content:center;">
              ${org.signature_url ? `<img src="${org.signature_url}" crossorigin="anonymous" style="height:90px; max-width:200px; object-fit:contain;"/>` : ''}
            </div>
            <div style="border-top:1px solid #555; margin-top:6px; padding-top:6px; font-size: 14px;">Organizer signature</div>
          </div>
        </div>
      </div>

      ${org.org_initiatives ? `
        <div style="margin-top: 22px; font-size: 13px; color:#0b6e3a; text-align:center; line-height:1.6;">
          <span style="font-weight:700;">${escapeHtml(org.org_initiatives)}</span>
        </div>
      ` : ''}
    </div>
  `;
}

function escapeHtml(s: string) {
  return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export async function generateReceiptPDF(r: ReceiptData): Promise<Blob> {
  const org = await loadOrgInfo();
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-10000px';
  wrapper.style.top = '0';
  wrapper.innerHTML = buildReceiptHTML(r, org);
  document.body.appendChild(wrapper);
  try {
    const node = wrapper.firstElementChild as HTMLElement;
    // Wait for all images to load to avoid blurry/missing assets in PDF
    const imgs = Array.from(node.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            })
      )
    );
    const canvas = await html2canvas(node, { scale: 3, useCORS: true, backgroundColor: '#ffffff', imageTimeout: 15000 });
    const img = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = canvas.height / canvas.width;
    const imgW = pageW - 40;
    const imgH = imgW * ratio;
    const finalH = Math.min(imgH, pageH - 40);
    const finalW = finalH === imgH ? imgW : (pageH - 40) / ratio;
    pdf.addImage(img, 'PNG', (pageW - finalW) / 2, 20, finalW, finalH, undefined, 'FAST');
    return pdf.output('blob');
  } finally {
    wrapper.remove();
  }
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
