// components/category-manager/use-collapsed.ts
// Which category cards are folded: one flag per category id, plus the collapse-all and
// expand-all the controls row offers.
import { useState } from "react";
import type { Category } from "./types";

export function useCollapsed(categories: Category[]) {
  const [collapsedStates, setCollapsedStates] = useState<
    Record<string, boolean>
  >({});

  const toggleCollapse = (id: string) => {
    setCollapsedStates((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const collapseAll = () => {
    const collapsed: Record<string, boolean> = {};
    categories.forEach((c: Category) => (collapsed[c.id] = true));
    setCollapsedStates(collapsed);
  };

  const expandAll = () => {
    const expanded: Record<string, boolean> = {};
    categories.forEach((c: Category) => (expanded[c.id] = false));
    setCollapsedStates(expanded);
  };

  return { collapsedStates, toggleCollapse, collapseAll, expandAll };
}
