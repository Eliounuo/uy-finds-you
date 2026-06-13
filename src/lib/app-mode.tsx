import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";

export type AppMode = "lite" | "pro";
export type Theme = "light" | "dark";

type AppState = {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  theme: Theme;
  toggleTheme: () => void;
};

const Ctx = createContext<AppState | null>(null);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [mode, setModeState] = useState<AppMode>("lite");
  const [theme, setTheme] = useState<Theme>("light");

  // Boot from localStorage
  useEffect(() => {
    const m = localStorage.getItem("uy:mode") as AppMode | null;
    const t = localStorage.getItem("uy:theme") as Theme | null;
    if (m) setModeState(m);
    if (t) setTheme(t);
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  // Pull mode from profile when user signs in
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("mode")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.mode === "lite" || data?.mode === "pro") {
          setModeState(data.mode);
          localStorage.setItem("uy:mode", data.mode);
        }
      });
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("uy:theme", theme);
  }, [theme]);

  const setMode = (m: AppMode) => {
    setModeState(m);
    localStorage.setItem("uy:mode", m);
    if (user) {
      supabase.from("profiles").update({ mode: m }).eq("id", user.id).then(() => {});
    }
  };

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return <Ctx.Provider value={{ mode, setMode, theme, toggleTheme }}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppModeProvider");
  return ctx;
}
