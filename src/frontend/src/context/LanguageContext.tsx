import {
  type Dictionary,
  type LanguageCode,
  dirFor,
  getDictionary,
  isRtl,
} from "@/i18n";
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "eco.language";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  hasChosen: boolean;
  t: Dictionary;
  dir: "rtl" | "ltr";
  rtl: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

function readStoredLanguage(): LanguageCode | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "ar" || stored === "ku") return stored;
  return null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode | null>(() =>
    readStoredLanguage(),
  );

  const setLanguage = useCallback((next: LanguageCode) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage may be unavailable (private mode); the session still works.
    }
  }, []);

  const active: LanguageCode = language ?? "en";
  const dir = dirFor(active);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = active;
    root.dir = dir;
  }, [active, dir]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language: active,
      setLanguage,
      hasChosen: language !== null,
      t: getDictionary(active),
      dir,
      rtl: isRtl(active),
    }),
    [active, setLanguage, language, dir],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
