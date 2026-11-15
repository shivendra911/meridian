/**
 * PlaceFlow / Meridian — Internationalization & Multilingual Scaffolding (Phase 8).
 * Supports English (default) and Hindi (Devanagari) for phone-first India recruitment journeys.
 */

export type Locale = 'en' | 'hi';

export const DICTIONARY = {
  en: {
    // Navigation
    nav_journey: 'Journey',
    nav_drives: 'Drives',
    nav_inbox: 'Inbox',
    nav_me: 'Me',

    // Journey Spine Stages
    stage_preparing: 'Preparing',
    stage_eligible: 'Eligible',
    stage_applied: 'Applied',
    stage_shortlisted: 'Shortlisted',
    stage_interview: 'Interview',
    stage_offer: 'Offer',
    stage_joined: 'Joined',

    // Hero Greetings & Actions
    good_morning: 'Good morning',
    good_afternoon: 'Good afternoon',
    good_evening: 'Good evening',
    apply_now: 'Apply Now',
    add_to_calendar: 'Add to calendar',
    view_details: 'View details',
    back_to_drives: 'Back to Drives',

    // Eligibility Ledger
    eligibility_ledger: 'Eligibility Ledger',
    eligible_to_apply: 'Eligible to Apply',
    not_eligible: 'Not Eligible',
    requirement: 'Requirement',
    your_record: 'Your record',

    // Receipts
    work_was_done: 'Work was done',
    audit_trail: 'Audit trail',
    verified: 'Verified',
  },
  hi: {
    // Navigation
    nav_journey: 'यात्रा',
    nav_drives: 'ड्राइव्स',
    nav_inbox: 'संदेश',
    nav_me: 'प्रोफ़ाइल',

    // Journey Spine Stages
    stage_preparing: 'तैयारी',
    stage_eligible: 'पात्र',
    stage_applied: 'आवेदन किया',
    stage_shortlisted: 'शॉर्टलिस्ट',
    stage_interview: 'साक्षात्कार',
    stage_offer: 'प्रस्ताव',
    stage_joined: 'शामिल हुए',

    // Hero Greetings & Actions
    good_morning: 'सुप्रभात',
    good_afternoon: 'शुभ दोपहर',
    good_evening: 'शुभ संध्या',
    apply_now: 'आवेदन करें',
    add_to_calendar: 'कैलेंडर में जोड़ें',
    view_details: 'विवरण देखें',
    back_to_drives: 'ड्राइव्स पर वापस जाएं',

    // Eligibility Ledger
    eligibility_ledger: 'पात्रता बहीखाता',
    eligible_to_apply: 'आवेदन करने के लिए पात्र',
    not_eligible: 'पात्र नहीं',
    requirement: 'आवश्यकता',
    your_record: 'आपका रिकॉर्ड',

    // Receipts
    work_was_done: 'कार्य पूर्ण हुआ',
    audit_trail: 'ऑडिट ट्रेल',
    verified: 'सत्यापित',
  },
} as const;

export type TranslationKey = keyof typeof DICTIONARY.en;

let currentLocale: Locale = 'en';

export const setLocale = (locale: Locale) => {
  currentLocale = locale;
};

export const getLocale = (): Locale => currentLocale;

export const t = (key: TranslationKey, locale?: Locale): string => {
  const target = locale || currentLocale;
  return DICTIONARY[target]?.[key] || DICTIONARY.en[key] || key;
};
