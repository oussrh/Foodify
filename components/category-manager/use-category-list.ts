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
import type { Category, Names } from "./types";

export function useCategoryList(initialData: Category[], restaurantId: string) {
  const [categories, setCategories] = useState<Category[]>(initialData);

  const addCategory = async (names: Names) => {
    const cat = await createCategory(restaurantId, {
      nameEn: names.en,
      nameFr: names.fr,
    });
    setCategories([...categories, { ...cat, subcategories: [], isActive: true }]);
  };

  const renameCategory = async (id: string, names: Names) => {
    await updateCategory(id, { nameEn: names.en, nameFr: names.fr });
    setCategories(prev =>
      prev.map(cat =>
        cat.id === id ? { ...cat, nameEn: names.en, nameFr: names.fr } : cat
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
