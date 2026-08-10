import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Heart } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('സാധുവായ ഇമെയിൽ നൽകുക'),
  password: z.string().min(6, 'പാസ്‌വേഡ് കുറഞ്ഞത് 6 അക്ഷരങ്ങൾ വേണം'),
});

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get('next') ?? '';
  const nextPath = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '';
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: 'Error',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'ലോഗിൻ പരാജയപ്പെട്ടു',
              description: 'ഇമെയിൽ അല്ലെങ്കിൽ പാസ്‌വേഡ് തെറ്റാണ്',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Error',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          if (nextPath) {
            window.location.href = nextPath;
          } else {
            navigate('/donors');
          }
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'രജിസ്ട്രേഷൻ പരാജയപ്പെട്ടു',
              description: 'ഈ ഇമെയിൽ ഇതിനകം രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Error',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'വിജയകരം!',
            description: 'അക്കൗണ്ട് സൃഷ്ടിച്ചു. ഇപ്പോൾ ലോഗിൻ ചെയ്യാം.',
          });
          setIsLogin(true);
        }
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
            <span className="text-2xl font-bold text-primary-foreground">AG</span>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            അജ്മീർ ഗേറ്റ് ക്യാമ്പസ് കാരാട്
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            സംഭാവന ട്രാക്കിംഗ് സിസ്റ്റം
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ഇമെയിൽ</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">പാസ്‌വേഡ്</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-input"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'കാത്തിരിക്കുക...' : isLogin ? 'ലോഗിൻ' : 'രജിസ്റ്റർ'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
            >
              {isLogin ? 'പുതിയ അക്കൗണ്ട് സൃഷ്ടിക്കാൻ ഇവിടെ ക്ലിക്ക് ചെയ്യുക' : 'ഇതിനകം അക്കൗണ്ട് ഉണ്ടോ? ലോഗിൻ ചെയ്യുക'}
            </button>
          </div>
          
          {/* Donor Portal Link */}
          <div className="mt-6 pt-4 border-t border-border">
            <Link to="/portal" className="block">
              <Button variant="outline" className="w-full gap-2">
                <Heart className="w-4 h-4" />
                ദാതാക്കളുടെ പോർട്ടൽ
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground text-center mt-2">
              നിങ്ങൾ ഒരു ദാതാവാണെങ്കിൽ ഇവിടെ ക്ലിക്ക് ചെയ്യുക
            </p>
          </div>

          {/* Install App Link */}
          <div className="mt-4 text-center">
            <Link to="/admin/install" className="text-sm text-primary hover:underline">
              📲 ഫോണിൽ അഡ്മിൻ ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യാൻ ഇവിടെ ക്ലിക്ക് ചെയ്യുക
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
