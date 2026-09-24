// components/category-manager/use-subcategory-list.ts
// The subcategories inside the categories: the per-category add drafts, and the add, rename
// (on blur) and move up/down both portals do the same way.
import { useState, type Dispatch, type SetStateAction } from "react";
import {
  createSubcategory,
  updateSubcategory,
  reorderSubcategories,
} from "@/app/actions/menu-actions";
import { checkNames } from "./check-names";
import type { Category, Names, SubDrafts, Subcategory } from "./types";

/**
 * The subcategories inside the categories: the per-category add drafts, and the add, rename
 * (on blur) and move up/down both portals do the same way.
 */
export function useSubcategoryList(
  categories: Category[],
  setCategories: Dispatch<SetStateAction<Category[]>>
) {
  const [subDrafts, setSubDrafts] = useState<SubDrafts>({});

  // Both handlers check with `categoryInput` (trimmed, both languages, 120 at most; a rename sends both, so the
  // patch the action parses takes it as it is) and toast its message.
  const addSub = async (catId: string, names: Names) => {
    const input = checkNames(names);
    if (!input) return;
    const sub = await createSubcategory(catId, input);
    setCategories((prev) =>
      prev.map((c: Category) =>
        c.id === catId ? { ...c, subcategories: [...c.subcategories, { ...sub, isActive: true }] } : c
      )
    );
    setSubDrafts((drafts) => ({
      ...drafts,
      [catId]: { en: "", fr: "" },
    }));
  };

  const renameSub = async (id: string, names: Names) => {
    const patch = checkNames(names);
    if (!patch) return;
    await updateSubcategory(id, patch);
  };

  const moveSub = async (catId: string, index: number, direction: "up" | "down") => {
    const cat = categories.find((c: Category) => c.id === catId);
    if (!cat) return;
    const subs = [...cat.subcategories];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= subs.length) return;
    const [item] = subs.splice(index, 1);
    if (!item) return;
    subs.splice(newIndex, 0, item);
    setCategories((prev) =>
      prev.map((c: Category) =>
        c.id === catId ? { ...c, subcategories: subs } : c
      )
    );
    await reorderSubcategories(
      catId,
      subs.map((s: Subcategory) => s.id)
    );
  };

  return { subDrafts, setSubDrafts, addSub, renameSub, moveSub };
}
