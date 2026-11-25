"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translations, type Message } from "./translations";

export type Language = "en" | "fr" | "es" | "ar";
const storageKey = "sellpostly-language";
const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  t: (message: Message) => string;
} | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "en" || saved === "fr" || saved === "es" || saved === "ar") setLanguage(saved as Language);
    } catch {
      // The switcher still works when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage(next: Language) {
      setLanguage(next);
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        // Keep the selection in memory for this session.
      }
    },
    t: (message: Message) => language === "en" ? message : (translations[message]?.[language as keyof typeof translations[Message]] || message),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("LanguageProvider is required.");
  return context;
}
