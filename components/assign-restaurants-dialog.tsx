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

  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
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
        <Button>Add Restaurant</Button>
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle>Assign Restaurants</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search restaurants..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-2"
        />
        <div className="max-h-60 overflow-y-auto flex flex-col gap-2 mt-2">
          {filteredRestaurants.map((r) => (
            <div
              key={r.id}
              className="flex items-center space-x-3 px-2 py-2 rounded hover:bg-muted cursor-pointer"
              onClick={() => toggle(r.id)}
            >
              <Checkbox
                checked={selected.includes(r.id)}
                onCheckedChange={() => toggle(r.id)}
              />
              <Label className="text-sm">{r.name}</Label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={loading}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
