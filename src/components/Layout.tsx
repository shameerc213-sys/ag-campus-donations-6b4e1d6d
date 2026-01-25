import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Home, Users, PlusCircle, LogOut, TrendingUp } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { signOut } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'ഹോം' },
    { path: '/donors', icon: Users, label: 'ദാതാക്കൾ' },
    { path: '/add-donor', icon: PlusCircle, label: 'പുതിയ ദാതാവ്' },
    { path: '/reports', icon: TrendingUp, label: 'റിപ്പോർട്ടുകൾ' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-sidebar text-sidebar-foreground shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-sidebar-primary-foreground">AG</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">അജ്മീർ ഗേറ്റ് ക്യാമ്പസ്</h1>
                <p className="text-xs text-sidebar-foreground/70">സംഭാവന മാനേജ്മെന്റ്</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="w-4 h-4 mr-2" />
              ലോഗൗട്ട്
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'text-primary bg-accent' 
                      : 'text-muted-foreground hover:text-primary hover:bg-accent/50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Layout;
