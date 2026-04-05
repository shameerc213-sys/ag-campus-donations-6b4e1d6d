import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssistantAuth } from '@/contexts/AssistantAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, CheckCircle2, Clock, HandHeart, LogOut, RefreshCw, Image, ArrowLeft, Camera, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import VoiceRecorder from '@/components/dua/VoiceRecorder';
import AttachmentPreview from '@/components/dua/AttachmentPreview';
import ShareButton from '@/components/dua/ShareButton';
import { useFileUpload } from '@/hooks/useFileUpload';

interface DuaReply {
  id: string;
  reply_text: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
}

interface DuaRequest {
  id: string;
  donor_id: string;
  message: string;
  reply: string | null;
  status: string | null;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  donors?: { name: string } | null;
  replies?: DuaReply[];
}

interface DonorGroup {
  donor_id: string;
  donor_name: string;
  requests: DuaRequest[];
  pendingCount: number;
  lastMessage: string;
  lastDate: string;
}

const AssistantDuaRequests = () => {
  const { isAuthenticated, loading: authLoading, logout } = useAssistantAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DuaRequest[]>([]);
  const [selectedDonorId, setSelectedDonorId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState<File | Blob | null>(null);
  const [replyAttachmentType, setReplyAttachmentType] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadFile, uploading } = useFileUpload();

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReplyAttachment(file);
      setReplyAttachmentType(file.type.split('/')[0]);
    }
    e.target.value = '';
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim() && !replyAttachment) return;
    try {
      let attachUrl: string | null = null;
      let attachType: string | null = null;

      if (replyAttachment) {
        const result = await uploadFile(replyAttachment, 'replies');
        if (result) {
          attachUrl = result.url;
          attachType = result.type;
        }
      }

      const replyMessage = replyText.trim() || (attachType === 'audio' ? '🎤 വോയിസ് മെസേജ്' : '📎 അറ്റാച്ച്മെന്റ്');

      await supabase.from('dua_replies').insert({
        dua_request_id: id,
        reply_text: replyMessage,
        attachment_url: attachUrl,
        attachment_type: attachType,
      });

      await supabase.from('dua_requests').update({
        status: 'replied',
        reply: replyMessage,
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      setReplyingId(null);
      setReplyText('');
      setReplyAttachment(null);
      setReplyAttachmentType('');
      fetchRequests();
      toast({ title: 'മറുപടി നൽകി' });
    } catch {
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

  // Group requests by donor
  const donorGroups: DonorGroup[] = Object.values(
    requests.reduce((acc, req) => {
      const dId = req.donor_id;
      if (!acc[dId]) {
        acc[dId] = {
          donor_id: dId,
          donor_name: req.donors?.name || 'Unknown',
          requests: [],
          pendingCount: 0,
          lastMessage: '',
          lastDate: '',
        };
      }
      acc[dId].requests.push(req);
      if (req.status !== 'replied') acc[dId].pendingCount++;
      if (!acc[dId].lastDate || req.created_at > acc[dId].lastDate) {
        acc[dId].lastDate = req.created_at;
        acc[dId].lastMessage = req.message;
      }
      return acc;
    }, {} as Record<string, DonorGroup>)
  ).sort((a, b) => {
    // Pending first, then by latest date
    if (a.pendingCount > 0 && b.pendingCount === 0) return -1;
    if (a.pendingCount === 0 && b.pendingCount > 0) return 1;
    return b.lastDate.localeCompare(a.lastDate);
  });

  const selectedGroup = donorGroups.find(g => g.donor_id === selectedDonorId);

  // Chat list view (WhatsApp-style)
  if (!selectedDonorId) {
    return (
      <div className="min-h-screen bg-background">
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

        {/* Donor list */}
        <div className="divide-y divide-border">
          {donorGroups.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">റിക്വസ്റ്റുകൾ ഇല്ല</p>
          ) : (
            donorGroups.map((group) => (
              <button
                key={group.donor_id}
                className="w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors text-left"
                onClick={() => setSelectedDonorId(group.donor_id)}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-lg">
                    {group.donor_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-foreground truncate">{group.donor_name}</p>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {new Date(group.lastDate).toLocaleDateString('ml-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">
                      {group.lastMessage.length > 40 ? group.lastMessage.slice(0, 40) + '...' : group.lastMessage}
                    </p>
                    {group.pendingCount > 0 && (
                      <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 flex-shrink-0 ml-2">
                        {group.pendingCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // Individual donor conversation view
  const donorRequests = selectedGroup?.requests || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => setSelectedDonorId(null)} className="text-primary-foreground hover:bg-primary-foreground/20">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
          <span className="font-bold text-sm">{selectedGroup?.donor_name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm">{selectedGroup?.donor_name}</p>
          <p className="text-xs opacity-80">{donorRequests.length} റിക്വസ്റ്റുകൾ</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRefresh} className="text-primary-foreground hover:bg-primary-foreground/20">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Requests */}
      <div className="p-4 space-y-3 pb-4">
        {donorRequests.map((req) => (
          <Card key={req.id} className={`border-l-4 ${req.status === 'replied' ? 'border-l-primary/50' : 'border-l-orange-400'}`}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start justify-between">
                <p className="text-xs text-muted-foreground">
                  {new Date(req.created_at).toLocaleDateString('ml-IN')}
                </p>
                <div className="flex items-center gap-1">
                  <ShareButton text={req.message} url={req.attachment_url || undefined} />
                  <Badge variant={req.status === 'replied' ? 'default' : 'secondary'}>
                    {req.status === 'replied' ? (
                      <><CheckCircle2 className="w-3 h-3 mr-1" />മറുപടി നൽകി</>
                    ) : (
                      <><Clock className="w-3 h-3 mr-1" />കാത്തിരിക്കുന്നു</>
                    )}
                  </Badge>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm">{req.message}</p>
              </div>

              {req.attachment_url && (
                <AttachmentPreview url={req.attachment_url} type={req.attachment_type} />
              )}

              {/* Replies */}
              {req.replies && req.replies.length > 0 && (
                <div className="space-y-2">
                  {req.replies.map((reply, index) => (
                    <div key={reply.id} className="bg-accent/50 p-3 rounded-lg">
                      <div className="flex items-start justify-between">
                        <p className="text-sm">{reply.reply_text}</p>
                        <ShareButton text={reply.reply_text} url={reply.attachment_url || undefined} />
                      </div>
                      {reply.attachment_url && (
                        <div className="mt-2">
                          <AttachmentPreview url={reply.attachment_url} type={reply.attachment_type} />
                        </div>
                      )}
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
                  {replyAttachment && (
                    <AttachmentPreview
                      file={replyAttachment}
                      type={replyAttachmentType}
                      onRemove={() => { setReplyAttachment(null); setReplyAttachmentType(''); }}
                    />
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <VoiceRecorder
                      onRecorded={(blob) => { setReplyAttachment(blob); setReplyAttachmentType('audio'); }}
                      disabled={!!replyAttachment}
                    />
                    <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={!!replyAttachment}>
                      <Image className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={() => cameraInputRef.current?.click()} disabled={!!replyAttachment}>
                      <Camera className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" onClick={() => videoInputRef.current?.click()} disabled={!!replyAttachment}>
                      <Video className="w-4 h-4" />
                    </Button>
                    <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
                    <input ref={videoInputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={handleFileSelect} />
                    <div className="flex-1" />
                    <Button size="sm" onClick={() => handleReply(req.id)} disabled={uploading || (!replyText.trim() && !replyAttachment)}>
                      <Send className="w-4 h-4 mr-1" />{uploading ? 'അയക്കുന്നു...' : 'അയക്കുക'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setReplyingId(null); setReplyText(''); setReplyAttachment(null); }}>
                      റദ്ദാക്കുക
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => { setReplyingId(req.id); setReplyText(''); setReplyAttachment(null); }}>
                  മറുപടി നൽകുക
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AssistantDuaRequests;
