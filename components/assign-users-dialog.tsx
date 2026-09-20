"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { call, callAll } from "@/lib/api-client";
import { toast } from "sonner";
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
    callAll<User>("/api/users?role=RESTAURANT_ADMIN")
      .then(setUsers)
      .catch(() => toast.error("Could not load the users"));
  }, [open]);

  const filteredUsers = users.filter((u: User) =>
    u.email.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((uid: string) => uid !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await call(`/api/restaurants/${restaurantId}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: selected }),
      });
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not save the assignments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Add User</Button>
      </DialogTrigger>
      <DialogContent className="bg-card">
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
            <label
              key={u.id}
              className="flex items-center space-x-3 px-2 py-2 rounded hover:bg-muted cursor-pointer"
            >
              <Checkbox
                checked={selected.includes(u.id)}
                onCheckedChange={() => toggle(u.id)}
              />
              <span className="text-sm font-medium leading-none">{u.email}</span>
            </label>
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
