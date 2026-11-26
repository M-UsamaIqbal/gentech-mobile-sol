"use client";

import * as React from "react";

import { useLocalizedRouteInfo } from "@/lib/localized-routing";
import { MAX_COMPARE_ITEMS, toggleCompareSelection } from "@/features/compare/lib/selection";

type CompareSelectionValue = {
  enabled: boolean;
  selected: string[];
  selectionMode: boolean;
  max: number;
  toggle: (id: string) => void;
  selectOne: (id: string) => void;
  start: () => void;
  clear: () => void;
  exit: () => void;
  compareHref: string;
};

const noop = () => undefined;

const CompareSelectionContext = React.createContext<CompareSelectionValue>({
  enabled: false,
  selected: [],
  selectionMode: false,
  max: MAX_COMPARE_ITEMS,
  toggle: noop,
  selectOne: noop,
  start: noop,
  clear: noop,
  exit: noop,
  compareHref: "/compare",
});

export function useCompareSelection(): CompareSelectionValue {
  return React.useContext(CompareSelectionContext);
}

export function CompareSelectionProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [selectionMode, setSelectionMode] = React.useState(false);
  const { country, locale, prefix } = useLocalizedRouteInfo();

  const toggle = React.useCallback((id: string) => {
    setSelected((current) => toggleCompareSelection(current, id));
  }, []);

  const selectOne = React.useCallback((id: string) => {
    setSelectionMode(true);
    setSelected((current) => toggleCompareSelection(current, id));
  }, []);

  const start = React.useCallback(() => setSelectionMode(true), []);
  const clear = React.useCallback(() => setSelected([]), []);
  const exit = React.useCallback(() => {
    setSelectionMode(false);
    setSelected([]);
  }, []);

  const compareHref = React.useMemo(() => {
    const ids = selected.slice(0, MAX_COMPARE_ITEMS).join(",");
    const base = prefix || (country && locale ? `/${country.toLowerCase()}/${locale}` : "");
    return `${base}/compare?listings=${ids}`;
  }, [selected, prefix, country, locale]);

  const value = React.useMemo<CompareSelectionValue>(
    () => ({
      enabled: true,
      selected,
      selectionMode,
      max: MAX_COMPARE_ITEMS,
      toggle,
      selectOne,
      start,
      clear,
      exit,
      compareHref,
    }),
    [selected, selectionMode, toggle, selectOne, start, clear, exit, compareHref],
  );

  return <CompareSelectionContext.Provider value={value}>{children}</CompareSelectionContext.Provider>;
}
