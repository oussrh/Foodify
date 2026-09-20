"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

interface AssignRestaurantRowProps {
  restaurant: { id: string; name: string };
  isSelected: boolean;
  /** Assigned before this dialog opened */
  wasOriginallySelected: boolean;
  onToggle: (id: string) => void;
}

/** One restaurant in the list: its checkbox and what saving would do to it. */
export default function AssignRestaurantRow({ restaurant: r, isSelected, wasOriginallySelected, onToggle }: AssignRestaurantRowProps) {
  const isChanged = isSelected !== wasOriginallySelected

  return (
    <div
      className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
 isSelected ? 'bg-muted border-border' : 'bg-card border-border hover:bg-muted'
 } ${isChanged ? 'ring-2' : ''}`}
    >
      <div className="flex items-center gap-3 flex-1">
        <Checkbox
          id={`assign-restaurant-${r.id}`}
          checked={isSelected}
          onCheckedChange={() => onToggle(r.id)}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-border-strong"
        />
        <div className="flex-1">
          <Label htmlFor={`assign-restaurant-${r.id}`} className="text-sm font-medium text-foreground cursor-pointer">
            {r.name}
          </Label>
          <div className="flex items-center gap-2 mt-1">
            {isSelected && (
              <Badge className="bg-muted text-muted-foreground border-border text-xs">
                <Check className="h-3 w-3 mr-1" />
                Selected
              </Badge>
            )}
            {isChanged && (
              <Badge variant="outline" className="text-xs text-warning border-border">
                {isSelected ? 'Will be Added' : 'Will be Removed'}
              </Badge>
            )}
            {wasOriginallySelected && !isChanged && (
              <Badge className="bg-muted text-muted-foreground border-border text-xs">
                Currently Assigned
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
