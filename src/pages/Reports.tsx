import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndianRupee, Calendar, TrendingUp, Download } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { downloadReceipt } from '@/lib/receipt';
import { useToast } from '@/hooks/use-toast';
import { htmlToPdf, escapeHtml } from '@/lib/htmlPdf';

interface ReportData {
  total: number;
  count: number;
  donations: Array<{
    id: string;
    amount: number;
    donation_date: string;
    donor_name: string;
    donor_phone?: string | null;
    receipt_number: string;
    notes?: string | null;
  }>;
}

const Reports = () => {
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<ReportData>({ total: 0, count: 0, donations: [] });
  const [loading, setLoading] = useState(false);
  const [weekStartDay, setWeekStartDay] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(0);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('organization_settings')
        .select('value')
        .eq('key', 'week_start_day')
        .maybeSingle();
      const n = Number(data?.value ?? 0);
      if (!isNaN(n) && n >= 0 && n <= 6) setWeekStartDay(n as 0 | 1 | 2 | 3 | 4 | 5 | 6);
    })();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('donations')
        .select(`
          id,
          amount,
          donation_date,
          receipt_number,
          notes,
          donors (name, phone)
        `)
        .gte('donation_date', startDate)
        .lte('donation_date', endDate)
        .order('donation_date', { ascending: false });

      const donations = data?.map(d => ({
        id: d.id,
        amount: Number(d.amount),
        donation_date: d.donation_date,
        donor_name: (d.donors as any)?.name || 'Unknown',
        donor_phone: (d.donors as any)?.phone || null,
        receipt_number: d.receipt_number || '',
        notes: d.notes || null,
      })) || [];

      const total = donations.reduce((sum, d) => sum + d.amount, 0);

      setReportData({
        total,
        count: donations.length,
        donations,
      });
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const setPresetDates = (preset: 'today' | 'week' | 'month' | 'year') => {
    const today = new Date();
    switch (preset) {
      case 'today':
        const todayStr = format(today, 'yyyy-MM-dd');
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case 'week':
        setStartDate(format(startOfWeek(today, { weekStartsOn: weekStartDay }), 'yyyy-MM-dd'));
        setEndDate(format(endOfWeek(today, { weekStartsOn: weekStartDay }), 'yyyy-MM-dd'));
        break;
      case 'month':
        setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
      case 'year':
        setStartDate(format(startOfYear(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfYear(today), 'yyyy-MM-dd'));
        break;
    }
  };

  const setSpecificDate = (date: string) => {
    setStartDate(date);
    setEndDate(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'OMR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const downloadReportPDF = async () => {
    try {
      const ORG_HEADING = 'അജ്മീർ ഗേറ്റ് ക്യാമ്പസ് - കാരാട്';
      const fromStr = format(new Date(startDate), 'dd/MM/yyyy');
      const toStr = format(new Date(endDate), 'dd/MM/yyyy');

      const rows = reportData.donations
        .map(
          (d, i) => `
          <tr>
            <td style="padding:6px 8px;border:1px solid #ddd;text-align:center;">${i + 1}</td>
            <td style="padding:6px 8px;border:1px solid #ddd;">${format(new Date(d.donation_date), 'dd/MM/yyyy')}</td>
            <td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtml(d.receipt_number || '-')}</td>
            <td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtml(d.donor_name)}</td>
            <td style="padding:6px 8px;border:1px solid #ddd;">${escapeHtml(d.donor_phone || '-')}</td>
            <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">${d.amount.toFixed(3)}</td>
          </tr>`,
        )
        .join('');

      const html = `
        <div style="padding:28px 24px;font-size:12px;line-height:1.4;">
          <div style="text-align:center;border-bottom:2px solid #107a57;padding-bottom:10px;margin-bottom:16px;">
            <h1 style="margin:0;font-size:20px;color:#107a57;">${escapeHtml(ORG_HEADING)}</h1>
            <h2 style="margin:6px 0 0;font-size:15px;color:#333;">സംഭാവന റിപ്പോർട്ട്</h2>
            <p style="margin:6px 0 0;font-size:12px;color:#555;">കാലയളവ്: ${fromStr} മുതൽ ${toStr} വരെ</p>
            <p style="margin:2px 0 0;font-size:12px;color:#555;">
              ആകെ: ${reportData.total.toFixed(3)} OMR  ·  സംഭാവനകൾ: ${reportData.count}
            </p>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:11px;">
            <thead>
              <tr style="background:#107a57;color:#fff;">
                <th style="padding:6px 8px;border:1px solid #ddd;width:32px;">#</th>
                <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">തീയതി</th>
                <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">റസീപ്റ്റ് നം.</th>
                <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">പേര്</th>
                <th style="padding:6px 8px;border:1px solid #ddd;text-align:left;">ഫോൺ</th>
                <th style="padding:6px 8px;border:1px solid #ddd;text-align:right;width:100px;">തുക (OMR)</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr style="background:#f3f4f6;font-weight:bold;">
                <td colspan="5" style="padding:6px 8px;border:1px solid #ddd;text-align:right;">ആകെ</td>
                <td style="padding:6px 8px;border:1px solid #ddd;text-align:right;">${reportData.total.toFixed(3)}</td>
              </tr>
            </tfoot>
          </table>
        </div>`;

      await htmlToPdf(html, `സംഭാവന_റിപ്പോർട്ട്_${startDate}_${endDate}.pdf`);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">റിപ്പോർട്ടുകൾ</h2>

      {/* Date Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            കാലയളവ് തിരഞ്ഞെടുക്കുക
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Presets */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setPresetDates('today')}>
              ഇന്ന്
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPresetDates('week')}>
              ഈ ആഴ്ച
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPresetDates('month')}>
              ഈ മാസം
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPresetDates('year')}>
              ഈ വർഷം
            </Button>
          </div>

          {/* Specific Date Picker */}
          <div className="space-y-2">
            <Label htmlFor="specific-date">ഒരു പ്രത്യേക ദിവസം തിരഞ്ഞെടുക്കുക</Label>
            <Input
              id="specific-date"
              type="date"
              onChange={(e) => setSpecificDate(e.target.value)}
              className="max-w-xs"
            />
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">തുടക്ക തീയതി</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">അവസാന തീയതി</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">തിരഞ്ഞെടുത്ത കാലയളവിലെ ആകെ</p>
              <p className="text-3xl font-bold text-primary mt-1">
                {formatCurrency(reportData.total)}
              </p>
            </div>
            <div className="text-right">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {reportData.count} സംഭാവനകൾ
              </p>
            </div>
          </div>
          <Button
            className="w-full mt-4"
            onClick={downloadReportPDF}
            disabled={reportData.count === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            റിപ്പോർട്ട് PDF ഡൗൺലോഡ് ചെയ്യുക
          </Button>
        </CardContent>
      </Card>

      {/* Donation List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">സംഭാവനകളുടെ വിശദാംശങ്ങൾ</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : reportData.donations.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              ഈ കാലയളവിൽ സംഭാവനകൾ ഇല്ല
            </p>
          ) : (
            <div className="space-y-3">
              {reportData.donations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <IndianRupee className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{donation.donor_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(donation.donation_date), 'dd/MM/yyyy')} · {donation.receipt_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="font-bold text-primary">{formatCurrency(donation.amount)}</p>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await downloadReceipt({
                            receipt_number: donation.receipt_number,
                            donor_name: donation.donor_name,
                            donor_phone: donation.donor_phone,
                            amount: donation.amount,
                            donation_date: donation.donation_date,
                            notes: donation.notes,
                          });
                        } catch (e: any) {
                          toast({ title: 'Error', description: e.message, variant: 'destructive' });
                        }
                      }}
                      title="PDF ഡൗൺലോഡ്"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
