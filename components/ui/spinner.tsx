import { cn } from "@/lib/utils"

export function Spinner({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent", className)}
      role="status"
      {...props}
    />
  )
}
