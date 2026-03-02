import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Info, IndianRupee, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

const PortalNav = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { to: '/portal/about', icon: Info, label: t('donor.aboutOrg') },
    { to: '/portal/donations', icon: IndianRupee, label: t('donor.donationHistory') },
    { to: '/portal/gallery', icon: Image, label: t('donor.gallery') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center py-2 px-3 rounded-lg",
                location.pathname === to
                  ? "text-primary bg-accent"
                  : "text-muted-foreground hover:text-primary hover:bg-accent/50"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs mt-1">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default PortalNav;
