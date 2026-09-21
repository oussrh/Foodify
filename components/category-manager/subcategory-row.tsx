// components/category-manager/subcategory-row.tsx
// One subcategory inside an open category card: its two names (renamed on blur), the move
// up/down pair, the active switch, and, when the portal may delete, the delete dialog.
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowUp, ArrowDown, Eye, EyeOff, Trash2 } from "lucide-react";
import DeleteDialog from "./delete-dialog";
import type { Names, Subcategory } from "./types";

export default function SubcategoryRow({
  categoryId,
  sub,
  index,
  count,
  onRenameSub,
  onToggleSubStatus,
  onDeleteSub,
  onMoveSub,
}: {
  categoryId: string;
  sub: Subcategory;
  index: number;
  /** How many subcategories the category has: the last one cannot move down. */
  count: number;
  onRenameSub: (id: string, names: Names) => void;
  onToggleSubStatus: (catId: string, subId: string) => void;
  onDeleteSub?: ((catId: string, id: string) => void) | undefined;
  onMoveSub: (catId: string, index: number, dir: "up" | "down") => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 p-3 border border-border rounded-lg ${sub.isActive === false ? "opacity-60" : ""}`}
    >
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          defaultValue={sub.nameEn}
          aria-label={`English name of ${sub.nameEn}`}
          onBlur={(e) =>
            onRenameSub(sub.id, {
              en: e.target.value,
              fr: sub.nameFr,
            })
          }
          className="border-border focus:border-border-strong"
        />
        <Input
          defaultValue={sub.nameFr}
          aria-label={`French name of ${sub.nameEn}`}
          onBlur={(e) =>
            onRenameSub(sub.id, {
              en: sub.nameEn,
              fr: e.target.value,
            })
          }
          className="border-border focus:border-border-strong"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => onMoveSub(categoryId, index, "up")}
            disabled={index === 0}
            aria-label={`Move ${sub.nameEn} up`}
          >
            <ArrowUp className="w-3 h-3" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => onMoveSub(categoryId, index, "down")}
            disabled={index === count - 1}
            aria-label={`Move ${sub.nameEn} down`}
          >
            <ArrowDown className="w-3 h-3" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {sub.isActive !== false ? (
            <Eye className="h-4 w-4 text-success" aria-hidden="true" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          )}
          <Switch
            checked={sub.isActive !== false}
            onCheckedChange={() => onToggleSubStatus(categoryId, sub.id)}
            aria-label={`${sub.nameEn} is shown on the menu`}
            className="data-[state=checked]:bg-primary"
          />
        </div>

        {onDeleteSub && (
          <DeleteDialog
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${sub.nameEn}`}
                className="w-8 h-8 text-destructive hover:text-destructive hover:bg-muted"
              >
                <Trash2 className="w-3 h-3" aria-hidden="true" />
              </Button>
            }
            title="Delete Subcategory"
            description={
              <>
                Are you sure you want to permanently delete &ldquo;{sub.nameEn}&rdquo;?
                This action cannot be undone.
              </>
            }
            onConfirm={() => onDeleteSub(categoryId, sub.id)}
          />
        )}
      </div>
    </div>
  );
}
