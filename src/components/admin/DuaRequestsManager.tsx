import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, CheckCircle2, Clock, HandHeart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DuaRequest {
  id: string;
  donor_id: string;
  message: string;
  reply: string | null;
  status: string | null;
  created_at: string;
  donors?: { name: string } | null;
}

const DuaRequestsManager = () => {
  const [requests, setRequests] = useState<DuaRequest[]>([]);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await supabase
        .from('dua_requests')
        .select('*, donors(name)')
        .order('created_at', { ascending: false });
      setRequests(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;
    try {
      await supabase.from('dua_requests').update({
        reply: replyText.trim(),
        status: 'replied',
        updated_at: new Date().toISOString(),
      }).eq('id', id);
      setReplyingId(null);
      setReplyText('');
      fetchRequests();
      toast({ title: 'മറുപടി നൽകി' });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandHeart className="w-5 h-5" />
          ദുആ റിക്വസ്റ്റുകൾ ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">റിക്വസ്റ്റുകൾ ഇല്ല</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-sm">{req.donors?.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString('ml-IN')}
                  </p>
                </div>
                <Badge variant={req.status === 'replied' ? 'default' : 'secondary'}>
                  {req.status === 'replied' ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1" />മറുപടി നൽകി</>
                  ) : (
                    <><Clock className="w-3 h-3 mr-1" />കാത്തിരിക്കുന്നു</>
                  )}
                </Badge>
              </div>

              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">{req.message}</p>
              </div>

              {req.reply && (
                <div className="bg-accent/50 p-3 rounded-lg">
                  <p className="text-sm">{req.reply}</p>
                </div>
              )}

              {replyingId === req.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="മറുപടി എഴുതുക..."
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleReply(req.id)}>
                      <Send className="w-4 h-4 mr-1" />അയക്കുക
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setReplyingId(null); setReplyText(''); }}>
                      റദ്ദാക്കുക
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => { setReplyingId(req.id); setReplyText(req.reply || ''); }}>
                  {req.reply ? 'മറുപടി എഡിറ്റ്' : 'മറുപടി നൽകുക'}
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default DuaRequestsManager;
