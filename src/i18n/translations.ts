export type Language = 'ml' | 'en';

export const translations = {
  // Common
  'app.name': {
    ml: 'അജ്മീർ ഗേറ്റ് ക്യാമ്പസ് കാരാട്',
    en: 'Ajmeer Gate Campus Karat'
  },
  'app.subtitle': {
    ml: 'സംഭാവന മാനേജ്മെന്റ്',
    en: 'Donation Management'
  },
  'common.loading': {
    ml: 'ലോഡ് ചെയ്യുന്നു...',
    en: 'Loading...'
  },
  'common.save': {
    ml: 'സേവ് ചെയ്യുക',
    en: 'Save'
  },
  'common.cancel': {
    ml: 'റദ്ദാക്കുക',
    en: 'Cancel'
  },
  'common.edit': {
    ml: 'എഡിറ്റ്',
    en: 'Edit'
  },
  'common.delete': {
    ml: 'നീക്കം ചെയ്യുക',
    en: 'Delete'
  },
  'common.search': {
    ml: 'തിരയുക',
    en: 'Search'
  },
  'common.download': {
    ml: 'ഡൗൺലോഡ്',
    en: 'Download'
  },
  'common.close': {
    ml: 'അടയ്ക്കുക',
    en: 'Close'
  },

  // Navigation
  'nav.home': {
    ml: 'ഹോം',
    en: 'Home'
  },
  'nav.donors': {
    ml: 'ദാതാക്കൾ',
    en: 'Donors'
  },
  'nav.addDonor': {
    ml: 'പുതിയ ദാതാവ്',
    en: 'New Donor'
  },
  'nav.reports': {
    ml: 'റിപ്പോർട്ടുകൾ',
    en: 'Reports'
  },
  'nav.settings': {
    ml: 'ക്രമീകരണങ്ങൾ',
    en: 'Settings'
  },
  'nav.logout': {
    ml: 'ലോഗൗട്ട്',
    en: 'Logout'
  },

  // Auth
  'auth.login': {
    ml: 'ലോഗിൻ',
    en: 'Login'
  },
  'auth.register': {
    ml: 'രജിസ്റ്റർ',
    en: 'Register'
  },
  'auth.email': {
    ml: 'ഇമെയിൽ',
    en: 'Email'
  },
  'auth.password': {
    ml: 'പാസ്‌വേഡ്',
    en: 'Password'
  },
  'auth.username': {
    ml: 'യൂസർനെയിം',
    en: 'Username'
  },
  'auth.loginFailed': {
    ml: 'ലോഗിൻ പരാജയപ്പെട്ടു',
    en: 'Login Failed'
  },
  'auth.invalidCredentials': {
    ml: 'യൂസർനെയിം അല്ലെങ്കിൽ പാസ്‌വേഡ് തെറ്റാണ്',
    en: 'Invalid username or password'
  },
  'auth.waiting': {
    ml: 'കാത്തിരിക്കുക...',
    en: 'Please wait...'
  },

  // Donor Portal
  'donor.welcome': {
    ml: 'സ്വാഗതം',
    en: 'Welcome'
  },
  'donor.donationHistory': {
    ml: 'സംഭാവന ചരിത്രം',
    en: 'Donation History'
  },
  'donor.aboutOrg': {
    ml: 'സ്ഥാപനത്തെ കുറിച്ച്',
    en: 'About Organization'
  },
  'donor.gallery': {
    ml: 'ഗാലറി',
    en: 'Gallery'
  },
  'donor.contact': {
    ml: 'ബന്ധപ്പെടുക',
    en: 'Contact'
  },
  'donor.totalDonation': {
    ml: 'ആകെ സംഭാവന',
    en: 'Total Donation'
  },
  'donor.noDonations': {
    ml: 'ഇതുവരെ സംഭാവനകൾ ഇല്ല',
    en: 'No donations yet'
  },
  'donor.thankYouMessage': {
    ml: 'അജ്മീർ ഗേറ്റിന് താങ്കൾ നൽകിവരുന്ന ഉദാരമായ സംഭാവനകൾക്ക് ഹൃദയം നിറഞ്ഞ നന്ദി അറിയിക്കുന്നു.',
    en: 'Heartfelt thanks for your generous contributions to Ajmeer Gate.'
  },
  'donor.prayerMessage': {
    ml: 'അല്ലാഹു താങ്കളുടെ സമ്പത്തിലും കുടുംബത്തിലും ബറക്കത്ത് ചെയ്യട്ടെ. പകരമായി പരലോകത്ത് വലിയ പ്രതിഫലം നൽകട്ടെ ആമീൻ',
    en: 'May Allah bless your wealth and family. May He grant you great rewards in the hereafter. Ameen'
  },
  'donor.notFound': {
    ml: 'ദാതാവിനെ കണ്ടെത്തിയില്ല',
    en: 'Donor not found'
  },

  // Admin
  'admin.orgSettings': {
    ml: 'സ്ഥാപന ക്രമീകരണങ്ങൾ',
    en: 'Organization Settings'
  },
  'admin.orgName': {
    ml: 'സ്ഥാപനത്തിന്റെ പേര്',
    en: 'Organization Name'
  },
  'admin.orgAddress': {
    ml: 'വിലാസം',
    en: 'Address'
  },
  'admin.orgPhone': {
    ml: 'ഫോൺ',
    en: 'Phone'
  },
  'admin.orgEmail': {
    ml: 'ഇമെയിൽ',
    en: 'Email'
  },
  'admin.orgDescription': {
    ml: 'വിവരണം',
    en: 'Description'
  },
  'admin.passwordPrefix': {
    ml: 'പാസ്‌വേഡ് പ്രിഫിക്സ്',
    en: 'Password Prefix'
  },
  'admin.photos': {
    ml: 'ഫോട്ടോകൾ',
    en: 'Photos'
  },
  'admin.videos': {
    ml: 'വീഡിയോകൾ',
    en: 'Videos'
  },
  'admin.addPhoto': {
    ml: 'ഫോട്ടോ ചേർക്കുക',
    en: 'Add Photo'
  },
  'admin.addVideo': {
    ml: 'വീഡിയോ ചേർക്കുക',
    en: 'Add Video'
  },
  'admin.language': {
    ml: 'ഭാഷ',
    en: 'Language'
  },
  'admin.malayalam': {
    ml: 'മലയാളം',
    en: 'Malayalam'
  },
  'admin.english': {
    ml: 'ഇംഗ്ലീഷ്',
    en: 'English'
  },

  // Donor management
  'donors.list': {
    ml: 'ദാതാക്കളുടെ ലിസ്റ്റ്',
    en: 'Donors List'
  },
  'donors.name': {
    ml: 'പേര്',
    en: 'Name'
  },
  'donors.phone': {
    ml: 'ഫോൺ',
    en: 'Phone'
  },
  'donors.address': {
    ml: 'വിലാസം',
    en: 'Address'
  },
  'donors.totalAmount': {
    ml: 'ആകെ തുക',
    en: 'Total Amount'
  },
  'donors.addNew': {
    ml: 'പുതിയ ദാതാവിനെ ചേർക്കുക',
    en: 'Add New Donor'
  },
  'donors.profile': {
    ml: 'ദാതാവിന്റെ പ്രൊഫൈൽ',
    en: 'Donor Profile'
  },
  'donors.shareLink': {
    ml: 'ലിങ്ക് ഷെയർ ചെയ്യുക',
    en: 'Share Link'
  },

  // Donations
  'donations.add': {
    ml: 'സംഭാവന ചേർക്കുക',
    en: 'Add Donation'
  },
  'donations.amount': {
    ml: 'തുക',
    en: 'Amount'
  },
  'donations.date': {
    ml: 'തീയതി',
    en: 'Date'
  },
  'donations.notes': {
    ml: 'കുറിപ്പുകൾ',
    en: 'Notes'
  },
  'donations.deleteConfirm': {
    ml: 'ഈ സംഭാവന നീക്കം ചെയ്യണോ?',
    en: 'Delete this donation?'
  },
  'donations.deleteWarning': {
    ml: 'ഈ പ്രവർത്തനം പഴയപടിയാക്കാൻ കഴിയില്ല.',
    en: 'This action cannot be undone.'
  },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, language: Language): string {
  return translations[key]?.[language] || key;
}
