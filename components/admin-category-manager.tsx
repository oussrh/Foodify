// PathFile: Foodify/components/admin-category-manager.tsx
"use client";

import { deleteCategory, deleteSubcategory } from "@/app/actions/menu-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import type { Category } from "@/components/category-manager/types";
import { useCategoryList } from "@/components/category-manager/use-category-list";
import { useSubcategoryList } from "@/components/category-manager/use-subcategory-list";
import { useCollapsed } from "@/components/category-manager/use-collapsed";
import { useCategoryToggles } from "@/components/category-manager/use-category-toggles";
import AddCategoryCard from "@/components/category-manager/add-category-card";
import EmptyCategories from "@/components/category-manager/empty-categories";
import CategoryDndList from "@/components/category-manager/category-dnd-list";
import SortableCategory from "@/components/category-manager/sortable-category";

/**
 * The super admin's editor for a restaurant's categories and subcategories: add, rename, reorder by
 * drag, switch on or off, delete; each change is saved as it is made.
 */
export default function AdminCategoryManager({
  initialData,
  restaurantId,
}: {
  initialData: Category[];
  restaurantId: string;
}) {
  const list = useCategoryList(initialData, restaurantId);
  const { categories, setCategories } = list;
  const subs = useSubcategoryList(categories, setCategories);
  const { collapsedStates, toggleCollapse, collapseAll, expandAll } = useCollapsed(categories);

  const { toggleCategory: handleToggleCategoryStatus, toggleSub: handleToggleSubStatus } = useCategoryToggles(setCategories);

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    setCategories(categories.filter((c: Category) => c.id !== id));
  };

  const handleDeleteSub = async (catId: string, id: string) => {
    await deleteSubcategory(id);
    setCategories((prev) =>
      prev.map((c: Category) =>
        c.id === catId
          ? {
              ...c,
              subcategories: c.subcategories.filter(
                (s) => s.id !== id
              ),
            }
          : c
      )
    );
  };

  return (
    <div className="space-y-8">
      {/* Add Category */}
      <AddCategoryCard onAdd={list.addCategory} iconClassName="text-muted-foreground" />

      {/* Controls */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Button variant="outline" onClick={collapseAll} size="sm">
            Collapse All
          </Button>
          <Button variant="outline" onClick={expandAll} size="sm">
            Expand All
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-muted text-muted-foreground border-border">
            <Shield className="h-3 w-3 mr-1" />
            Admin Mode
          </Badge>
          <span className="text-sm text-muted-foreground">Full control (create, edit, delete, deactivate)</span>
        </div>
      </div>

      {/* Categories */}
      {categories.length === 0 ? (
        <EmptyCategories iconClassName="text-muted-foreground">
          Start organizing the menu by creating your first category
        </EmptyCategories>
      ) : (
        <CategoryDndList categories={categories} onDragEnd={list.onDragEnd}>
          {categories.map((cat: Category) => (
            <SortableCategory
              key={cat.id}
              category={cat}
              onRename={list.renameCategory}
              onToggleStatus={handleToggleCategoryStatus}
              onDelete={handleDeleteCategory}
              onAddSub={subs.addSub}
              onRenameSub={subs.renameSub}
              onToggleSubStatus={handleToggleSubStatus}
              onDeleteSub={handleDeleteSub}
              onMoveSub={subs.moveSub}
              subDrafts={subs.subDrafts}
              setSubDrafts={subs.setSubDrafts}
              collapsed={collapsedStates[cat.id] ?? false}
              toggleCollapsed={() => toggleCollapse(cat.id)}
            />
          ))}
        </CategoryDndList>
      )}
    </div>
  );
}
