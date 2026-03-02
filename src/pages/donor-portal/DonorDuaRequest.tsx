import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDonorAuth } from '@/contexts/DonorAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, MessageCircle, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalNav from '@/components/portal/PortalNav';

interface DuaRequest {
  id: string;
  message: string;
  reply: string | null;
  status: string | null;
  created_at: string;
}

const DonorDuaRequest = () => {
  const { donor, loading } = useDonorAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DuaRequest[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !donor) navigate('/portal');
  }, [donor, loading, navigate]);

  useEffect(() => {
    if (donor) fetchRequests();
  }, [donor]);

  const fetchRequests = async () => {
    if (!donor) return;
    try {
      const { data } = await supabase
        .from('dua_requests')
        .select('*')
        .eq('donor_id', donor.id)
        .order('created_at', { ascending: false });
      setRequests(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!donor || !newMessage.trim()) return;
    setSubmitting(true);
    try {
      await supabase.from('dua_requests').insert({
        donor_id: donor.id,
        message: newMessage.trim(),
      });
      setNewMessage('');
      fetchRequests();
      toast({
        title: language === 'ml' ? 'സമർപ്പിച്ചു' : 'Submitted',
        description: language === 'ml' ? 'ദുആ റിക്വസ്റ്റ് വിജയകരമായി സമർപ്പിച്ചു' : 'Dua request submitted successfully',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: language === 'ml' ? 'സമർപ്പിക്കാൻ കഴിഞ്ഞില്ല' : 'Failed to submit',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!donor) return null;

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-24">
        <Button variant="ghost" size="sm" onClick={() => navigate('/portal/home')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          {language === 'ml' ? 'തിരികെ' : 'Back'}
        </Button>

        <h2 className="text-xl font-bold text-foreground">
          {language === 'ml' ? 'ദുആ റിക്വസ്റ്റ്' : 'Dua Request'}
        </h2>

        {/* Submit new request */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Textarea
              placeholder={language === 'ml' ? 'നിങ്ങളുടെ ദുആ ആവശ്യം ഇവിടെ എഴുതുക...' : 'Write your dua request here...'}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={3}
              maxLength={1000}
            />
            <Button
              onClick={handleSubmit}
              disabled={!newMessage.trim() || submitting}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting 
                ? (language === 'ml' ? 'സമർപ്പിക്കുന്നു...' : 'Submitting...') 
                : (language === 'ml' ? 'സമർപ്പിക്കുക' : 'Submit')}
            </Button>
          </CardContent>
        </Card>

        {/* Previous requests */}
        {loadingData ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : requests.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">
              {language === 'ml' ? 'മുൻ റിക്വസ്റ്റുകൾ' : 'Previous Requests'}
            </h3>
            {requests.map((req) => (
              <Card key={req.id} className="border-l-4 border-l-primary/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-foreground">{req.message}</p>
                  </div>
                  {req.reply && (
                    <div className="flex items-start gap-2 bg-accent/50 p-3 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-foreground">{req.reply}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {req.status === 'replied' ? (
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    <span>
                      {new Date(req.created_at).toLocaleDateString(language === 'ml' ? 'ml-IN' : 'en-IN')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PortalNav />
    </div>
  );
};

export default DonorDuaRequest;
