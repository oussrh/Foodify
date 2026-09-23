// components/category-manager/category-dnd-list.tsx
// The sortable shell around the category cards: the pointer sensor, the drag context and the
// vertical sorting strategy. The cards themselves are the children. The context takes React's
// id: dnd-kit numbers its aria-describedby ids from a module counter otherwise, which differs
// between the server render and the client and made every card a hydration mismatch.
"use client";

import { useId, type ReactNode } from "react";
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

/**
 * The drag-and-drop context the category cards are reordered in; a drag starts after 5px. It passes
 * React's id to dnd-kit so the server and client renders agree.
 */
export default function CategoryDndList({
  categories,
  onDragEnd,
  children,
}: {
  categories: Category[];
  onDragEnd: (event: DragEndEvent) => void;
  children: ReactNode;
}) {
  const id = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  return (
    <DndContext
      id={id}
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
