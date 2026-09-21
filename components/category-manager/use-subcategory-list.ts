// components/category-manager/use-subcategory-list.ts
// The subcategories inside the categories: the per-category add drafts, and the add, rename
// (on blur) and move up/down both portals do the same way.
import { useState, type Dispatch, type SetStateAction } from "react";
import {
  createSubcategory,
  updateSubcategory,
  reorderSubcategories,
} from "@/app/actions/menu-actions";
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

  const addSub = async (catId: string, names: Names) => {
    if (!names.en || !names.fr) return;
    const sub = await createSubcategory(catId, {
      nameEn: names.en,
      nameFr: names.fr,
    });
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
    await updateSubcategory(id, {
      nameEn: names.en,
      nameFr: names.fr,
    });
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
