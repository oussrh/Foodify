// components/category-manager/category-dnd-list.tsx
// The sortable shell around the category cards: the pointer sensor, the drag context and the
// vertical sorting strategy. The cards themselves are the children.
"use client";

import type { ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Category } from "./types";

export default function CategoryDndList({
  categories,
  onDragEnd,
  children,
}: {
  categories: Category[];
  onDragEnd: (event: DragEndEvent) => void;
  children: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={categories.map((c: Category) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {children}
        </div>
      </SortableContext>
    </DndContext>
  );
}
