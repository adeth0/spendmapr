"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

const STORAGE_KEY = "spendmapr-investments-beginner-mode";

type InvestmentsBeginnerContextValue = {
  beginnerMode: boolean;
  setBeginnerMode: (value: boolean) => void;
  toggleBeginnerMode: () => void;
};

const InvestmentsBeginnerContext = createContext<InvestmentsBeginnerContextValue | null>(null);

export function InvestmentsBeginnerProvider({ children }: { children: ReactNode }) {
  const [beginnerMode, setBeginnerModeState] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "true" || raw === "false") {
        setBeginnerModeState(raw === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const setBeginnerMode = useCallback((value: boolean) => {
    setBeginnerModeState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
    } catch {
      // ignore
    }
  }, []);

  const toggleBeginnerMode = useCallback(() => {
    setBeginnerMode(!beginnerMode);
  }, [beginnerMode, setBeginnerMode]);

  const value = useMemo(
    () => ({ beginnerMode, setBeginnerMode, toggleBeginnerMode }),
    [beginnerMode, setBeginnerMode, toggleBeginnerMode]
  );

  return (
    <InvestmentsBeginnerContext.Provider value={value}>{children}</InvestmentsBeginnerContext.Provider>
  );
}

export function useInvestmentsBeginnerMode() {
  const context = useContext(InvestmentsBeginnerContext);
  if (!context) {
    throw new Error("useInvestmentsBeginnerMode must be used within InvestmentsBeginnerProvider");
  }
  return context;
}

export function BeginnerModeToggle() {
  const { beginnerMode, toggleBeginnerMode } = useInvestmentsBeginnerMode();

  return (
    <div className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-950">Beginner mode</p>
        <p className="text-sm leading-6 text-slate-500">
          {beginnerMode
            ? "Simpler explanations, index-focused picks, and long-term basics."
            : "Full metrics, all ETFs, and more detail for each holding."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={beginnerMode}
        onClick={toggleBeginnerMode}
        className={`relative inline-flex h-9 w-[3.25rem] shrink-0 items-center rounded-full border transition-colors ${
          beginnerMode ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-100"
        }`}
      >
        <span className="sr-only">Toggle beginner mode</span>
        <span
          className={`inline-block h-7 w-7 rounded-full bg-white shadow-sm transition-transform ${
            beginnerMode ? "translate-x-[1.25rem]" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
