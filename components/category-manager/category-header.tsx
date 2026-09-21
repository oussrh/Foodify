// components/category-manager/category-header.tsx
// The header of a category card: the fold toggle, the drag handle, the name (or, in edit mode,
// the two name inputs with Save and Cancel), the count badge, the active switch, the edit
// button and, when the portal may delete, the delete dialog.
"use client";

import { useState } from "react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { GripVertical, ChevronDown, ChevronRight, Edit2, Trash2 } from "lucide-react";
import DeleteDialog from "./delete-dialog";
import type { Category, Names } from "./types";

export default function CategoryHeader({
  category,
  collapsed,
  toggleCollapsed,
  dragHandle,
  onRename,
  onToggleStatus,
  onDelete,
}: {
  category: Category;
  collapsed: boolean;
  toggleCollapsed: () => void;
  dragHandle: { attributes: DraggableAttributes; listeners: DraggableSyntheticListeners };
  onRename: (id: string, names: Names) => void;
  onToggleStatus: (id: string) => void;
  onDelete?: ((id: string) => void) | undefined;
}) {
  const [editMode, setEditMode] = useState(false);
  const [editNames, setEditNames] = useState({ en: category.nameEn, fr: category.nameFr });

  const handleSaveEdit = () => {
    onRename(category.id, editNames);
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditNames({ en: category.nameEn, fr: category.nameFr });
    setEditMode(false);
  };

  return (
    <CardHeader className="border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${category.nameEn}`}
            className="shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-4 h-4" aria-hidden="true" />
            )}
          </Button>
          <GripVertical
            className="text-muted-foreground shrink-0 cursor-grab"
            aria-label={`Drag to reorder ${category.nameEn}`}
            {...dragHandle.attributes}
            {...dragHandle.listeners}
          />

          {editMode ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editNames.en}
                onChange={(e) => setEditNames({ ...editNames, en: e.target.value })}
                aria-label="English name"
                className="border-border focus:border-border-strong"
                placeholder="English name"
              />
              <Input
                value={editNames.fr}
                onChange={(e) => setEditNames({ ...editNames, fr: e.target.value })}
                aria-label="French name"
                className="border-border focus:border-border-strong"
                placeholder="French name"
              />
              <Button size="sm" onClick={handleSaveEdit} className="bg-primary hover:bg-primary">
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 flex-1">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{category.nameEn}</h3>
                {category.nameFr && (
                  <p className="text-sm text-muted-foreground italic">{category.nameFr}</p>
                )}
              </div>
              <Badge variant="outline" className="text-muted-foreground border-border">
                {category.subcategories.length} sub{category.subcategories.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        {!editMode && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {category.isActive !== false ? 'Active' : 'Inactive'}
              </span>
              <Switch
                checked={category.isActive !== false}
                onCheckedChange={() => onToggleStatus(category.id)}
                aria-label={`${category.nameEn} is shown on the menu`}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditMode(true)}
              aria-label={`Rename ${category.nameEn}`}
              className="text-muted-foreground hover:text-muted-foreground"
            >
              <Edit2 className="h-4 w-4" aria-hidden="true" />
            </Button>
            {onDelete && (
              <DeleteDialog
                trigger={
                  <Button variant="ghost" size="sm" aria-label={`Delete ${category.nameEn}`} className="text-destructive hover:text-destructive hover:bg-muted">
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                }
                title="Delete Category"
                description={
                  <>
                    Are you sure you want to permanently delete &ldquo;{category.nameEn}&rdquo;?
                    This action cannot be undone and will also delete all subcategories.
                  </>
                }
                onConfirm={() => onDelete(category.id)}
              />
            )}
          </div>
        )}
      </div>
    </CardHeader>
  );
}
