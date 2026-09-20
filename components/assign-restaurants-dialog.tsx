"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Building2, 
  Search, 
  Check, 
  X,
  Loader2
} from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
}

export default function AssignRestaurantsDialog({
  userId,
  defaultRestaurantIds,
}: {
  userId: string;
  defaultRestaurantIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState<string[]>(defaultRestaurantIds);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    fetch("/api/restaurants")
      .then((res) => res.json())
      .then((data: Restaurant[]) => setRestaurants(data));
  }, [open]);

  const filteredRestaurants = restaurants.filter((r: Restaurant) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((rid: string) => rid !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    await fetch(`/api/users/${userId}/restaurants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantIds: selected }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="">
          <Plus className="h-4 w-4 mr-2" />
          Assign Restaurants
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            Assign Restaurants to User
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search restaurants by name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 border-border focus:border-border-strong"
            />
          </div>
          
          {/* Selected count */}
          <div className="flex items-center justify-between p-3 bg-muted border border-border rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">
                {selected.length} restaurant{selected.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            {selected.length !== defaultRestaurantIds.length && (
              <Badge className="bg-muted text-warning border-border">
                Changes Pending
              </Badge>
            )}
          </div>
          
          {/* Restaurant List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredRestaurants.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {query ? `No restaurants found matching "${query}"` : 'No restaurants available'}
                </p>
              </div>
            ) : (
              filteredRestaurants.map((r: Restaurant) => {
                const isSelected = selected.includes(r.id)
                const wasOriginallySelected = defaultRestaurantIds.includes(r.id)
                const isChanged = isSelected !== wasOriginallySelected
                
                return (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between p-3 border rounded-lg transition-colors cursor-pointer ${
 isSelected ? 'bg-muted border-border' : 'bg-card border-border hover:bg-muted'
 } ${isChanged ? 'ring-2' : ''}`}
                    onClick={() => toggle(r.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggle(r.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-border-strong"
                      />
                      <div className="flex-1">
                        <Label className="text-sm font-medium text-foreground cursor-pointer">
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
              })
            )}
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || selected.length === 0}
            className=""
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Save Assignment{selected.length !== 1 ? 's' : ''}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
