"use client";

import {
  toggleCategoryStatus,
  toggleSubcategoryStatus,
} from "@/app/actions/menu-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Category } from "@/components/category-manager/types";
import { useCategoryList } from "@/components/category-manager/use-category-list";
import { useSubcategoryList } from "@/components/category-manager/use-subcategory-list";
import { useCollapsed } from "@/components/category-manager/use-collapsed";
import AddCategoryCard from "@/components/category-manager/add-category-card";
import EmptyCategories from "@/components/category-manager/empty-categories";
import CategoryDndList from "@/components/category-manager/category-dnd-list";
import SortableCategory from "@/components/category-manager/sortable-category";

export default function ManagerCategoryManager({
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

  const handleToggleCategoryStatus = async (id: string) => {
    try {
      await toggleCategoryStatus(id);
      setCategories(prev =>
        prev.map(cat =>
          cat.id === id ? { ...cat, isActive: !cat.isActive } : cat
        )
      );
    } catch (error) {
      console.error('Failed to toggle category status:', error);
    }
  };

  const handleToggleSubStatus = async (catId: string, subId: string) => {
    try {
      await toggleSubcategoryStatus(subId);
      setCategories(prev =>
        prev.map(cat =>
          cat.id === catId
            ? {
                ...cat,
                subcategories: cat.subcategories.map(sub =>
                  sub.id === subId ? { ...sub, isActive: !sub.isActive } : sub
                ),
              }
            : cat
        )
      );
    } catch (error) {
      console.error('Failed to toggle subcategory status:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Add Category */}
      <AddCategoryCard onAdd={list.addCategory} iconClassName="text-success" />

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
          <Badge className="bg-muted text-warning border-border">
            Manager Mode
          </Badge>
          <span className="text-sm text-muted-foreground">Organize & enable/disable (no delete)</span>
        </div>
      </div>

      {/* Categories */}
      {categories.length === 0 ? (
        <EmptyCategories iconClassName="text-success">
          Start organizing your menu by creating your first category
        </EmptyCategories>
      ) : (
        <CategoryDndList categories={categories} onDragEnd={list.onDragEnd}>
          {categories.map((cat: Category) => (
            <SortableCategory
              key={cat.id}
              category={cat}
              onRename={list.renameCategory}
              onToggleStatus={handleToggleCategoryStatus}
              onAddSub={subs.addSub}
              onRenameSub={subs.renameSub}
              onToggleSubStatus={handleToggleSubStatus}
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
