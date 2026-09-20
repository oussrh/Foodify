// components/category-manager/empty-categories.tsx
// The dashed card shown while a restaurant has no category; the sentence and the icon colour
// are the portal's.
import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FolderPlus } from "lucide-react";

export default function EmptyCategories({
  iconClassName,
  children,
}: {
  iconClassName: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center">
            <FolderPlus className={`h-8 w-8 ${iconClassName}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">No categories yet</h3>
            <p className="text-muted-foreground mt-1">
              {children}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
