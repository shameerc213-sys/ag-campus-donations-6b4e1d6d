import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDonorAuth } from '@/contexts/DonorAuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, User, MapPin } from 'lucide-react';
import PortalHeader from '@/components/portal/PortalHeader';
import PortalNav from '@/components/portal/PortalNav';

interface Contact {
  id: string;
  name: string;
  designation: string | null;
  phone: string | null;
  phones: string[];
  photos: string[];
  location: string | null;
}

const DonorContacts = () => {
  const { donor, loading } = useDonorAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !donor) navigate('/portal');
  }, [donor, loading, navigate]);

  useEffect(() => {
    fetchContacts();
    fetchEnquiryPhone();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .order('sort_order', { ascending: true });
      setContacts(((data || []) as any[]).map(r => ({
        ...r,
        phones: Array.isArray(r.phones) && r.phones.length ? r.phones : (r.phone ? [r.phone] : []),
        photos: Array.isArray(r.photos) ? r.photos : [],
      })));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchEnquiryPhone = async () => {
    try {
      const { data } = await supabase
        .from('organization_settings')
        .select('value')
        .eq('key', 'org_phone')
        .maybeSingle();
      setEnquiryPhone(data?.value || '');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const locationHref = (loc: string) => {
    if (/^https?:\/\//i.test(loc)) return loc;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
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
          {language === 'ml' ? 'ബന്ധപ്പെടേണ്ട നമ്പറുകൾ' : 'Contact Numbers'}
        </h2>

        {enquiryPhone && (
          <a
            href={`tel:${enquiryPhone}`}
            className="block p-4 bg-primary/10 border-2 border-primary/30 rounded-xl text-center space-y-2"
          >
            <span className="inline-block bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
              FOR ENQUIRIES
            </span>
            <p className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
              <Phone className="w-5 h-5" />
              {enquiryPhone}
            </p>
          </a>
        )}

        {loadingData ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : contacts.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {language === 'ml' ? 'നമ്പറുകൾ ഇല്ല' : 'No contacts'}
          </p>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="p-4 bg-card border border-border rounded-xl space-y-3">
                <div className="flex items-center gap-4">
                  {contact.photos[0] ? (
                    <img src={contact.photos[0]} alt={contact.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{contact.name}</p>
                    {contact.designation && (
                      <p className="text-xs text-muted-foreground">{contact.designation}</p>
                    )}
                  </div>
                </div>

                {contact.photos.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {contact.photos.slice(1).map((u, i) => (
                      <img key={i} src={u} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    ))}
                  </div>
                )}

                <div className="space-y-1">
                  {contact.phones.map((p, i) => (
                    <a
                      key={i}
                      href={`tel:${p}`}
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Phone className="w-4 h-4" />{p}
                    </a>
                  ))}
                </div>

                {contact.location && (
                  <a
                    href={locationHref(contact.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{contact.location}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <PortalNav />
    </div>
  );
};

export default DonorContacts;
