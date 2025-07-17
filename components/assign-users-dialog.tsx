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
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  email: string;
}

export default function AssignUsersDialog({
  restaurantId,
  defaultUserIds,
}: {
  restaurantId: string;
  defaultUserIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<string[]>(defaultUserIds);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    fetch("/api/users?role=RESTAURANT_ADMIN")
      .then((res) => res.json())
      .then((data: User[]) => setUsers(data));
  }, [open]);

  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    await fetch(`/api/restaurants/${restaurantId}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds: selected }),
    });
    setLoading(false);
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Add User</Button>
      </DialogTrigger>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Assign Users</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-2"
        />
        <div className="max-h-64 overflow-y-auto flex flex-col gap-2 mt-2">
          {filteredUsers.map((u: User) => (
            <div
              key={u.id}
              className="flex items-center space-x-3 px-2 py-2 rounded hover:bg-muted cursor-pointer"
              onClick={() => toggle(u.id)}
            >
              <Checkbox
                checked={selected.includes(u.id)}
                onCheckedChange={() => toggle(u.id)}
              />
              <Label className="text-sm">{u.email}</Label>
            </div>
          ))}
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
