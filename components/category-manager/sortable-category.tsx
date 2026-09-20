// components/category-manager/sortable-category.tsx
// One category as a sortable card: the drag transform, the header, and (when not folded) its
// subcategory rows and the add-subcategory block. The delete handlers are optional: the admin
// portal passes them, the manager portal does not, and the card shows what it was given.
"use client";

import type { Dispatch, SetStateAction } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import CategoryHeader from "./category-header";
import SubcategoryRow from "./subcategory-row";
import AddSubcategory from "./add-subcategory";
import type { Category, Names, SubDrafts, Subcategory } from "./types";

export default function SortableCategory({
  category,
  onRename,
  onToggleStatus,
  onDelete,
  onAddSub,
  onRenameSub,
  onToggleSubStatus,
  onDeleteSub,
  onMoveSub,
  subDrafts,
  setSubDrafts,
  collapsed,
  toggleCollapsed,
}: {
  category: Category;
  onRename: (id: string, names: Names) => void;
  onToggleStatus: (id: string) => void;
  onDelete?: (id: string) => void;
  onAddSub: (catId: string, names: Names) => void;
  onRenameSub: (id: string, names: Names) => void;
  onToggleSubStatus: (catId: string, subId: string) => void;
  onDeleteSub?: (catId: string, id: string) => void;
  onMoveSub: (catId: string, index: number, dir: "up" | "down") => void;
  subDrafts: SubDrafts;
  setSubDrafts: Dispatch<SetStateAction<SubDrafts>>;
  collapsed: boolean;
  toggleCollapsed: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`border-0 ${isDragging ? "ring-2" : ""} ${category.isActive === false ? "opacity-60" : ""}`}>
        <CategoryHeader
          category={category}
          collapsed={collapsed}
          toggleCollapsed={toggleCollapsed}
          dragHandle={{ attributes, listeners }}
          onRename={onRename}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />

        {!collapsed && (
          <CardContent className="p-6 space-y-4">
            {/* Subcategories */}
            {category.subcategories.map((sub: Subcategory, i: number) => (
              <SubcategoryRow
                key={sub.id}
                categoryId={category.id}
                sub={sub}
                index={i}
                count={category.subcategories.length}
                onRenameSub={onRenameSub}
                onToggleSubStatus={onToggleSubStatus}
                onDeleteSub={onDeleteSub}
                onMoveSub={onMoveSub}
              />
            ))}

            {/* Add subcategory */}
            <AddSubcategory
              categoryId={category.id}
              subDrafts={subDrafts}
              setSubDrafts={setSubDrafts}
              onAddSub={onAddSub}
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
