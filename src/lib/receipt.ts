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
  // Bold the prefix before ":" in initiatives line
  let initiativesHtml = '';
  if (org.org_initiatives) {
    const txt = org.org_initiatives;
    const idx = txt.indexOf(':');
    if (idx > 0) {
      initiativesHtml = `<span style="font-weight:800;">${escapeHtml(txt.slice(0, idx + 1))}</span>${escapeHtml(txt.slice(idx + 1))}`;
    } else {
      initiativesHtml = escapeHtml(txt);
    }
  }
  return `
    <div style="width: 640px; padding: 20px; font-family: 'Helvetica', Arial, sans-serif; color: #1a1a1a; background: #ffffff; box-sizing: border-box;">
      <!-- MAIN CARD with green border -->
      <div style="border: 2px solid #2E7D32; border-radius: 20px; padding: 24px;">
        <!-- HEADER GRID: 3/9 -->
        <div style="display:flex; align-items:center; gap:16px;">
          <div style="width: 25%; text-align:center;">
            ${org.org_logo_url ? `<img src="${org.org_logo_url}" crossorigin="anonymous" style="max-height:90px; max-width:100%; object-fit:contain;"/>` : ''}
          </div>
          <div style="width: 75%; text-align:center;">
            <div style="font-size: 22px; font-weight: 800; color:#1b5e20; line-height:1.15;">${escapeHtml(org.org_name || '')}</div>
            ${org.org_subtitle ? `<div style="font-size: 12px; margin-top:4px; color:#333; font-weight:500;">${escapeHtml(org.org_subtitle)}</div>` : ''}
            ${org.org_address ? `<div style="font-size: 11px; margin-top:6px; color:#555; white-space: pre-line; line-height:1.4;">${escapeHtml(org.org_address)}</div>` : ''}
            ${(phones || org.org_email) ? `<div style="font-size: 11px; color:#555; margin-top:3px;">${phones ? 'Ph: ' + escapeHtml(phones) : ''}${org.org_email ? (phones ? ' &nbsp;|&nbsp; ' : '') + escapeHtml(org.org_email) : ''}</div>` : ''}
          </div>
        </div>

        <!-- TITLE -->
        <div style="text-align:center; font-size: 20px; font-weight: 800; letter-spacing:2px; text-transform:uppercase; color:#000; margin: 18px 0 14px;">DONATION RECEIPT</div>

        <!-- Receipt no & Date -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 14px;">
          <div style="color:#dc2626; font-weight:700; font-size:16px;">Receipt no: ${escapeHtml(r.receipt_number)}</div>
          <div style="font-size:13px; font-weight:500; color:#222;">Date: ${dateFmt}</div>
        </div>

        <!-- Fields -->
        <table style="width:100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding:6px 0; width:130px; color:#444;">Received from</td>
            <td style="padding:6px 0;">: <span style="font-weight:600;">${escapeHtml(r.donor_name)}</span></td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#444;">Amount</td>
            <td style="padding:6px 0;">: <span style="color:#1b5e20; font-weight:700; font-size:18px;">${amountFmt} OMR</span></td>
          </tr>
          <tr>
            <td style="padding:6px 0; color:#444; vertical-align:top;">In words</td>
            <td style="padding:6px 0;">: ${amountInWords(r.amount)}</td>
          </tr>
          ${r.notes ? `<tr><td style="padding:6px 0; color:#444; vertical-align:top;">Notes</td><td style="padding:6px 0;">: ${escapeHtml(r.notes)}</td></tr>` : ''}
        </table>

        <!-- Thank you box -->
        <div style="margin-top: 16px; background:#f3f4f6; padding: 10px 12px; border-radius:6px; text-align:center; font-size:12px; font-style:italic; color:#444;">
          Thankyou for your generous contribution, May Allah accept your charity and reward you abundantly.
        </div>

        <!-- Seal + Signature -->
        <div style="margin-top: 20px; display:flex; justify-content: space-between; align-items: flex-end;">
          <div style="text-align:center; width:45%;">
            <div style="height:120px; display:flex; align-items:center; justify-content:center;">
              ${org.seal_url ? `<img src="${org.seal_url}" crossorigin="anonymous" style="height:120px; max-width:100%; object-fit:contain; transform: rotate(-18deg);"/>` : ''}
            </div>
            <div style="border-top:1px solid #9ca3af; width:160px; margin: 4px auto 0; padding-top:4px; font-size:11px; color:#444;">official seal</div>
          </div>
          <div style="text-align:center; width:45%;">
            <div style="height:120px; display:flex; align-items:flex-end; justify-content:center;">
              ${org.signature_url ? `<img src="${org.signature_url}" crossorigin="anonymous" style="height:70px; max-width:100%; object-fit:contain;"/>` : ''}
            </div>
            <div style="border-top:1px solid #9ca3af; width:160px; margin: 4px auto 0; padding-top:4px; font-size:11px; color:#444;">Organizer signature</div>
          </div>
        </div>
      </div>

      ${initiativesHtml ? `
        <div style="margin-top: 14px; font-size: 11px; color:#1b5e20; text-align:center; line-height:1.5; font-weight:500;">
          ${initiativesHtml}
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
