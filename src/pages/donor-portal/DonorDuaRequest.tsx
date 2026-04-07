import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDonorAuth } from '@/contexts/DonorAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, MessageCircle, CheckCircle2, Clock, Image, Trash2, Camera, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalNav from '@/components/portal/PortalNav';
import VoiceRecorder from '@/components/dua/VoiceRecorder';
import AttachmentPreview from '@/components/dua/AttachmentPreview';
import ShareButton from '@/components/dua/ShareButton';
import { useFileUpload } from '@/hooks/useFileUpload';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface DuaReply {
  id: string;
  reply_text: string;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  sender_type?: string;
}

interface DuaRequest {
  id: string;
  message: string;
  reply: string | null;
  status: string | null;
  created_at: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  replies?: DuaReply[];
}

const DonorDuaRequest = () => {
  const { donor, loading } = useDonorAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<DuaRequest[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [attachment, setAttachment] = useState<File | Blob | null>(null);
  const [attachmentType, setAttachmentType] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadFile, uploading } = useFileUpload();

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
      setLoadingData(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment(file);
      setAttachmentType(file.type.split('/')[0]);
    }
  };

  const handleVoiceRecorded = (blob: Blob) => {
    setAttachment(blob);
    setAttachmentType('audio');
  };

  const handleSubmit = async () => {
    if (!donor || (!newMessage.trim() && !attachment)) return;
    setSubmitting(true);
    try {
      let attachUrl: string | null = null;
      let attachType: string | null = null;

      if (attachment) {
        const result = await uploadFile(attachment, 'requests');
        if (result) {
          attachUrl = result.url;
          attachType = result.type;
        }
      }

      await supabase.from('dua_requests').insert({
        donor_id: donor.id,
        message: newMessage.trim() || (attachType === 'audio' ? '🎤 വോയിസ് മെസേജ്' : '📎 അറ്റാച്ച്മെന്റ്'),
        attachment_url: attachUrl,
        attachment_type: attachType,
      });

      setNewMessage('');
      setAttachment(null);
      setAttachmentType('');
      fetchRequests();
      toast({
        title: language === 'ml' ? 'സമർപ്പിച്ചു' : 'Submitted',
        description: language === 'ml' ? 'ദുആ റിക്വസ്റ്റ് വിജയകരമായി സമർപ്പിച്ചു' : 'Dua request submitted successfully',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (requestId: string) => {
    try {
      // Delete replies first, then the request
      await supabase.from('dua_replies').delete().eq('dua_request_id', requestId);
      await supabase.from('dua_requests').delete().eq('id', requestId);
      setRequests(prev => prev.filter(r => r.id !== requestId));
      toast({
        title: language === 'ml' ? 'ഡിലീറ്റ് ചെയ്തു' : 'Deleted',
      });
    } catch (error) {
      console.error('Error:', error);
      toast({ title: 'Error', variant: 'destructive' });
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

            {attachment && (
              <AttachmentPreview
                file={attachment}
                type={attachmentType}
                onRemove={() => { setAttachment(null); setAttachmentType(''); }}
              />
            )}

            <div className="flex items-center gap-2">
              <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={!!attachment} />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={!!attachment}
              >
                <Image className="w-4 h-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="flex-1" />
              <Button
                onClick={handleSubmit}
                disabled={(!newMessage.trim() && !attachment) || submitting || uploading}
              >
                <Send className="w-4 h-4 mr-1" />
                {submitting || uploading
                  ? (language === 'ml' ? 'അയക്കുന്നു...' : 'Sending...')
                  : (language === 'ml' ? 'അയക്കുക' : 'Send')}
              </Button>
            </div>
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
                  {/* Donor's message - right aligned */}
                  <div className="flex justify-end">
                    <div className="bg-primary/10 p-3 rounded-lg rounded-tr-none max-w-[85%]">
                      <div className="flex items-start gap-2">
                        <p className="text-sm text-foreground flex-1">{req.message}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <ShareButton text={req.message} url={req.attachment_url || undefined} />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {language === 'ml' ? 'ഡിലീറ്റ് ചെയ്യണോ?' : 'Delete this request?'}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {language === 'ml'
                                    ? 'ഈ മെസ്സേജും അതിന്റെ എല്ലാ മറുപടികളും ഡിലീറ്റ് ആകും. ഇത് പഴയപടിയാക്കാൻ കഴിയില്ല.'
                                    : 'This message and all its replies will be permanently deleted.'}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel'}
                                </AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(req.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  {language === 'ml' ? 'ഡിലീറ്റ് ചെയ്യുക' : 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      {req.attachment_url && (
                        <div className="mt-2">
                          <AttachmentPreview url={req.attachment_url} type={req.attachment_type} />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 text-right">
                        {new Date(req.created_at).toLocaleDateString(language === 'ml' ? 'ml-IN' : 'en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Replies */}
                  {req.replies && req.replies.length > 0 && (
                    <div className="space-y-2">
                      {req.replies.map((reply) => {
                        const isFromAssistant = reply.sender_type !== 'donor';
                        return (
                          <div key={reply.id} className={`flex ${isFromAssistant ? 'justify-start' : 'justify-end'}`}>
                            <div className={`p-3 rounded-lg max-w-[85%] ${
                              isFromAssistant
                                ? 'bg-accent/50 rounded-tl-none'
                                : 'bg-primary/10 rounded-tr-none'
                            }`}>
                              <div className="flex items-start gap-2">
                                {isFromAssistant && <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />}
                                <p className="text-sm text-foreground flex-1">{reply.reply_text}</p>
                                <ShareButton text={reply.reply_text} url={reply.attachment_url || undefined} />
                              </div>
                              {reply.attachment_url && (
                                <div className="mt-2">
                                  <AttachmentPreview url={reply.attachment_url} type={reply.attachment_type} />
                                </div>
                              )}
                              <p className={`text-xs text-muted-foreground mt-1 ${isFromAssistant ? 'text-left' : 'text-right'}`}>
                                {new Date(reply.created_at).toLocaleDateString(language === 'ml' ? 'ml-IN' : 'en-IN')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {req.status === 'replied' ? (
                      <CheckCircle2 className="w-3 h-3 text-primary" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    <span>{req.status === 'replied'
                      ? (language === 'ml' ? 'മറുപടി ലഭിച്ചു' : 'Replied')
                      : (language === 'ml' ? 'കാത്തിരിക്കുന്നു' : 'Pending')
                    }</span>
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
