import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssistantAuth } from '@/contexts/AssistantAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { HandHeart } from 'lucide-react';

const AssistantLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAssistantAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If already logged in, redirect
  if (isAuthenticated) {
    navigate('/assistant/dua-requests', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    try {
      const success = await login(username.trim(), password.trim());
      if (success) {
        navigate('/assistant/dua-requests');
      } else {
        toast({
          title: 'ലോഗിൻ പരാജയപ്പെട്ടു',
          description: 'തെറ്റായ യൂസർനെയിം അല്ലെങ്കിൽ പാസ്‌വേഡ്',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-2">
            <HandHeart className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            അസിസ്റ്റന്റ് പോർട്ടൽ
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Ajmeer Gate Campus Karad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">യൂസർനെയിം</Label>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">പാസ്‌വേഡ്</Label>
              <PasswordInput
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'ലോഗിൻ ചെയ്യുന്നു...' : 'ലോഗിൻ'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssistantLogin;
