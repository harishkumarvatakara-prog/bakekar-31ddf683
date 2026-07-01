import { createContext, useContext, useState, type ReactNode } from "react";

type GlobalSearchContext = {
  query: string;
  setQuery: (q: string) => void;
};

const GlobalSearchContext = createContext<GlobalSearchContext | null>(null);

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  return (
    <GlobalSearchContext.Provider value={{ query, setQuery }}>
      {children}
    </GlobalSearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const ctx = useContext(GlobalSearchContext);
  if (!ctx) throw new Error("useGlobalSearch must be used inside GlobalSearchProvider");
  return ctx;
}
