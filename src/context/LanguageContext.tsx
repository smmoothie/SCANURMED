import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const translations: Translations = {
  home: { en: 'Home', hi: 'मुख्य पृष्ठ' },
  search: { en: 'Search', hi: 'खोजें' },
  scanner: { en: 'Scanner', hi: 'स्कैनर' },
  company_options: { en: 'Company Options', hi: 'कंपनी विकल्प' },
  login: { en: 'Company Login', hi: 'कंपनी लॉगिन' },
  logout: { en: 'Logout', hi: 'लॉगआउट' },
  verify_title: { en: 'Verify Authorized Medicine Labels Instantly', hi: 'अधिकृत दवा लेबल की तुरंत पुष्टि करें' },
  hero_sub: {
    en: 'B2B pharmaceutical verification system connecting registered manufacturers with pharmacies, hospitals, and patients.',
    hi: 'पंजीकृत निर्माताओं को फार्मेसियों, अस्पतालों और रोगियों से जोड़ने वाला B2B फार्मास्युटिकल सत्यापन मंच।'
  },
  scan_btn: { en: 'Scan QR Label', hi: 'क्यूआर लेबल स्कैन करें' },
  search_btn: { en: 'Search Catalog', hi: 'कैटलॉग खोजें' },
  unauthorized: { en: 'QR is unauthorized', hi: 'क्यूआर अनधिकृत है' },
  med_details: { en: 'Medicine Details', hi: 'दवा का विवरण' },
  ingredients: { en: 'Active Ingredients', hi: 'सक्रिय सामग्री' },
  dosage: { en: 'Dosage Information', hi: 'खुराक की जानकारी' },
  side_effects: { en: 'Side Effects', hi: 'दुष्प्रभाव' },
  allergy_warning: { en: 'Allergy Warning', hi: 'एलर्जी की चेतावनी' },
  expiry: { en: 'Expiry Date', hi: 'समाप्ति तिथि' },
  mfg: { en: 'MFG Date', hi: 'निर्माण तिथि' },
  medical_uses: { en: 'Medical Uses', hi: 'चिकित्सा उपयोग' },
  other_uses: { en: 'Other Possible Uses', hi: 'अन्य संभावित उपयोग' },
  alternatives: { en: 'Alternative Medicines', hi: 'वैकल्पिक दवाएं' },
  search_placeholder: { en: 'Search by medicine name, ingredient, or 13-digit QR code...', hi: 'दवा का नाम, सामग्री या 13-अंक का क्यूआर कोड दर्ज करें...' },
  search_instruction: { en: 'Browse and verify the 20 authorized medicine labels.', hi: '20 अधिकृत दवा लेबल खोजें और सत्यापित करें।' },
  no_results: { en: 'No authorized label found for', hi: 'इसके लिए कोई अधिकृत लेबल नहीं मिला' },
  unauthorized_sub: {
    en: 'This QR code is not among the 20 authorized medicine labels. No medicine data can be provided.',
    hi: 'यह क्यूआर कोड 20 अधिकृत दवा लेबल में शामिल नहीं है। कोई दवा डेटा उपलब्ध नहीं है।'
  },
  try_again: { en: 'Scan Another Label', hi: 'दूसरा लेबल स्कैन करें' },
  back: { en: 'Back', hi: 'पीछे' },
  manage_catalog: { en: 'Manage authorized product entries and view scan metrics.', hi: 'अधिकृत उत्पाद प्रविष्टियां प्रबंधित करें और स्कैन मेट्रिक्स देखें।' },
  medicines: { en: 'Medicines', hi: 'दवाएं' },
  add_new: { en: 'Add Entry', hi: 'नया जोड़ें' },
  analytics: { en: 'Analytics', hi: 'एनालिटिक्स' },
  seed_data: { en: 'Sync 20 Labels to DB', hi: '20 लेबल डेटाबेस में सिंक करें' },
  seeding: { en: 'Syncing...', hi: 'सिंक हो रहा है...' },
  seeded: { en: '20 Labels Synced', hi: '20 लेबल सिंक हो गए' },
  med_name: { en: 'Medicine Name', hi: 'दवा का नाम' },
  barcode_val: { en: 'Authorized QR Code Value', hi: 'अधिकृत क्यूआर कोड मान' },
  ingredients_comma: { en: 'Ingredients (comma separated)', hi: 'सामग्री (कोमा से अलग)' },
  dosage_info: { en: 'Dosage Information', hi: 'खुराक की जानकारी' },
  mfg_date: { en: 'Manufacturing Date', hi: 'निर्माण की तारीख' },
  expiry_date: { en: 'Expiry Date', hi: 'समाप्ति की तारीख' },
  save_med: { en: 'Save Medicine', hi: 'दवा सहेजें' },
  total_scans: { en: 'Total Scans', hi: 'कुल स्कैन' },
  active_meds: { en: 'Registered Entries', hi: 'पंजीकृत प्रविष्टियां' },
  recent_activity: { en: 'Recent Activity', hi: 'हाल की गतिविधि' },
  top_scanned: { en: 'Top Scanned Medicines', hi: 'शीर्ष स्कैन की गई दवाएं' },
  recent_scan_activity: { en: 'Recent Scan Activity', hi: 'हालिया स्कैन गतिविधि' },
  no_meds: { en: 'No medicines registered under this company account yet.', hi: 'इस कंपनी खाते में अभी तक कोई दवा पंजीकृत नहीं है।' },
  no_scan_activity: { en: 'No scan activity recorded yet.', hi: 'अभी तक कोई स्कैन गतिविधि दर्ज नहीं हुई है।' },
  access_denied: { en: 'Access Denied', hi: 'पहुंच वर्जित' },
  login_as_pharma: { en: 'Only authorized company accounts can access company options and create a profile.', hi: 'केवल अधिकृत कंपनी खाते ही कंपनी विकल्पों तक पहुंच सकते हैं और प्रोफ़ाइल बना सकते हैं।' },
  verified_info: { en: 'Strict Label Allowlist', hi: 'सख्त लेबल अनुमोदन' },
  verified_info_sub: { en: 'Only the 20 verified pharmaceutical QR labels are recognized. Unrecognized codes return zero data.', hi: 'केवल 20 सत्यापित फार्मास्युटिकल क्यूआर लेबल ही पहचाने जाते हैं। अनधिकृत कोड कोई डेटा नहीं देते।' },
  centralized_db: { en: 'Clinical Reference Data', hi: 'क्लिनिकल संदर्भ डेटा' },
  centralized_db_sub: { en: 'Structured active ingredients, dosage schedules, allergy warnings, and therapeutic alternatives.', hi: 'सक्रिय सामग्री, खुराक, एलर्जी चेतावनी और वैकल्पिक दवाओं का व्यवस्थित विवरण।' },
  realtime_analytics: { en: 'Manufacturer Analytics', hi: 'निर्माता एनालिटिक्स' },
  realtime_analytics_sub: { en: 'Track verification scan logs and product lookup counts in Firestore.', hi: 'Firestore में सत्यापन स्कैन लॉग और उत्पाद लुकअप संख्या ट्रैक करें।' },
  how_it_works: { en: 'Verification Workflow', hi: 'सत्यापन प्रक्रिया' },
  step1_title: { en: 'Authenticate', hi: 'प्रमाणीकरण' },
  step1_sub: { en: 'Pharmaceutical accounts sign in and sync authorized label records.', hi: 'फार्मास्युटिकल खाते साइन इन करके अधिकृत लेबल रिकॉर्ड सिंक करते हैं।' },
  step2_title: { en: 'Scan Label', hi: 'लेबल स्कैन' },
  step2_sub: { en: 'Scan a QR label via live camera, image upload, or 13-digit code.', hi: 'लाइव कैमरा, छवि अपलोड या 13-अंक कोड से क्यूआर लेबल स्कैन करें।' },
  step3_title: { en: 'Allowlist Check', hi: 'अनुमति जांच' },
  step3_sub: { en: 'System verifies the code strictly against the 20 authorized medicine labels.', hi: 'सिस्टम कोड की जांच केवल 20 अधिकृत दवा लेबल के विरुद्ध करता है।' },
  step4_title: { en: 'Inspect Data', hi: 'विवरण देखें' },
  step4_sub: { en: 'Authorized codes show dosage and warnings; others are rejected.', hi: 'अधिकृत कोड खुराक और चेतावनी दिखाते हैं; अन्य अस्वीकार किए जाते हैं।' },
  scan_instruction: { en: 'Point camera at one of the 20 authorized medicine QR labels', hi: 'कैमरे को 20 अधिकृत दवा क्यूआर लेबल में से किसी एक पर रखें' },
  scan_tip: { en: 'Only the 20 QR labels from the authorized medicine sheet are recognized. Any other QR code will be flagged as unauthorized and return no data.', hi: 'केवल अधिकृत दवा शीट के 20 क्यूआर लेबल ही पहचाने जाएंगे। कोई भी अन्य क्यूआर कोड अनधिकृत माना जाएगा और कोई डेटा नहीं देगा।' },
  upload_error: { en: 'Could not decode a QR code from this image. Ensure the label is crisp and well lit.', hi: 'इस छवि से क्यूआर कोड नहीं पढ़ा जा सका। सुनिश्चित करें कि लेबल स्पष्ट है।' },
  manual_entry: { en: 'Manual Code Entry', hi: 'मैन्युअल कोड प्रविष्टि' },
  enter_code_tip: { en: 'Enter the 13-digit code printed below the QR label', hi: 'क्यूआर लेबल के नीचे छपा 13-अंक का कोड दर्ज करें' },
  verify_code: { en: 'Verify Label', hi: 'लेबल सत्यापित करें' },
  initializing_camera: { en: 'Starting Camera', hi: 'कैमरा शुरू हो रहा है' },
  allow_camera_access: { en: 'Allow camera permission in your browser', hi: 'कृपया ब्राउज़र में कैमरा अनुमति दें' },
  scan_success: { en: 'Authorized Label Verified', hi: 'अधिकृत लेबल सत्यापित' },
  upload_qr: { en: 'Upload QR Label Image', hi: 'क्यूआर लेबल छवि अपलोड करें' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
