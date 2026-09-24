// components/category-manager/use-category-list.ts
// The categories of one restaurant as the manager holds them: the list, and the add, rename
// and drag-reorder both portals do the same way (the role-specific status and delete handlers
// stay in the entry component).
import { useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  createCategory,
  updateCategory,
  reorderCategories,
} from "@/app/actions/menu-actions";
import { checkNames } from "./check-names";
import type { Category, Names } from "./types";

/**
 * The categories of one restaurant as the manager holds them: the list, and the add, rename
 * and drag-reorder both portals do the same way (the role-specific status and delete handlers
 * stay in the entry component).
 */
export function useCategoryList(initialData: Category[], restaurantId: string) {
  const [categories, setCategories] = useState<Category[]>(initialData);

  // Both handlers check with `categoryInput` (trimmed, both languages, 120 at most; a rename sends both, so the
  // patch the action parses takes it as it is) and toast its message.
  const addCategory = async (names: Names): Promise<boolean> => {
    const input = checkNames(names);
    if (!input) return false;
    const cat = await createCategory(restaurantId, input);
    setCategories([...categories, { ...cat, subcategories: [], isActive: true }]);
    return true;
  };

  const renameCategory = async (id: string, names: Names) => {
    const patch = checkNames(names);
    if (!patch) return;
    await updateCategory(id, patch);
    setCategories(prev =>
      prev.map(cat =>
        cat.id === id ? { ...cat, ...patch } : cat
      )
    );
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c: Category) => c.id === active.id);
    const newIndex = categories.findIndex((c: Category) => c.id === over.id);

    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);
    await reorderCategories(
      restaurantId,
      reordered.map((c: Category) => c.id)
    );
  };

  return { categories, setCategories, addCategory, renameCategory, onDragEnd };
}
