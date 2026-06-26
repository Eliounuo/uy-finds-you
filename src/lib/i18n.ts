import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ru from "@/locales/ru.json";
import kz from "@/locales/kz.json";
import en from "@/locales/en.json";

export const SUPPORTED_LANGUAGES = ["ru", "kz", "en"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const STORAGE_KEY = "yurta_lang";

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "ru";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)) {
      return stored as Language;
    }
  } catch {
    // ignore
  }
  return "ru";
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      ru: { translation: ru },
      kz: { translation: kz },
      en: { translation: en },
    },
    lng: getInitialLanguage(),
    fallbackLng: "ru",
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    interpolation: { escapeValue: false },
    returnNull: false,
    react: { useSuspense: false },
  });
}

export function setLanguage(lng: Language) {
  void i18n.changeLanguage(lng);
  try {
    window.localStorage.setItem(STORAGE_KEY, lng);
    document.documentElement.lang = lng;
  } catch {
    // ignore
  }
}

export function getLanguage(): Language {
  return (i18n.language as Language) || "ru";
}

export default i18n;
