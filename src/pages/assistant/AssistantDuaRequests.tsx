import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssistantAuth } from '@/contexts/AssistantAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, CheckCircle2, Clock, HandHeart, LogOut, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DuaReply {
  id: string;
  reply_text: string;
  created_at: string;
}

interface DuaRequest {
  id: string;
  donor_id: string;
  message: string;
  reply: string | null;
  status: string | null;
  created_at: string;
  donors?: { name: string } | null;
  replies?: DuaReply[];
}

const AssistantDuaRequests = () => {
  const { isAuthenticated, loading: authLoading, logout } = useAssistantAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DuaRequest[]>([]);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/assistant', { replace: true });
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) fetchRequests();
  }, [isAuthenticated]);

  const fetchRequests = async () => {
    try {
      const { data } = await supabase
        .from('dua_requests')
        .select('*, donors(name)')
        .order('created_at', { ascending: false });

      const requestsWithReplies = await Promise.all(
        (data || []).map(async (req) => {
          const { data: replies } = await supabase
            .from('dua_replies')
            .select('*')
            .eq('dua_request_id', req.id)
            .order('created_at', { ascending: true });
          return { ...req, replies: replies || [] };
        })
      );

      setRequests(requestsWithReplies as DuaRequest[]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;
    try {
      await supabase.from('dua_replies').insert({
        dua_request_id: id,
        reply_text: replyText.trim(),
      });

      await supabase.from('dua_requests').update({
        status: 'replied',
        reply: replyText.trim(),
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

  const handleLogout = () => {
    logout();
    navigate('/assistant');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const pendingCount = requests.filter(r => r.status !== 'replied').length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <HandHeart className="w-5 h-5" />
          <span className="font-bold">ദുആ റിക്വസ്റ്റുകൾ</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleRefresh} className="text-primary-foreground hover:bg-primary-foreground/20">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground hover:bg-primary-foreground/20">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{requests.length}</p>
            <p className="text-xs text-muted-foreground">ആകെ റിക്വസ്റ്റുകൾ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">കാത്തിരിക്കുന്നവ</p>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <div className="p-4 space-y-3">
        {requests.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">റിക്വസ്റ്റുകൾ ഇല്ല</p>
        ) : (
          requests.map((req) => (
            <Card key={req.id} className={`border-l-4 ${req.status === 'replied' ? 'border-l-primary/50' : 'border-l-orange-400'}`}>
              <CardContent className="pt-4 space-y-3">
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

                {/* Show all replies */}
                {req.replies && req.replies.length > 0 && (
                  <div className="space-y-2">
                    {req.replies.map((reply, index) => (
                      <div key={reply.id} className="bg-accent/50 p-3 rounded-lg">
                        <p className="text-sm">{reply.reply_text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          മറുപടി {index + 1} • {new Date(reply.created_at).toLocaleDateString('ml-IN')}
                        </p>
                      </div>
                    ))}
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
                  <Button size="sm" variant="outline" onClick={() => { setReplyingId(req.id); setReplyText(''); }}>
                    മറുപടി നൽകുക
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AssistantDuaRequests;
