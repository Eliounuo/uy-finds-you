import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppMode = "lite" | "pro";
export type Theme = "light" | "dark";

type AppState = {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  theme: Theme;
  toggleTheme: () => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
};

const Ctx = createContext<AppState | null>(null);

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("lite");
  const [theme, setTheme] = useState<Theme>("light");
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const m = localStorage.getItem("uy:mode") as AppMode | null;
    const t = localStorage.getItem("uy:theme") as Theme | null;
    const f = localStorage.getItem("uy:fav");
    if (m) setModeState(m);
    if (t) setTheme(t);
    else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
    if (f) setFavorites(JSON.parse(f));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("uy:theme", theme);
  }, [theme]);

  const setMode = (m: AppMode) => {
    setModeState(m);
    localStorage.setItem("uy:mode", m);
  };

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("uy:fav", JSON.stringify(next));
      return next;
    });
  };

  return (
    <Ctx.Provider value={{ mode, setMode, theme, toggleTheme, favorites, toggleFavorite }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppModeProvider");
  return ctx;
}
