// components/reset-password/reset-footer.tsx
// The reset dialog's footer: Cancel and Reset before the reset, Done after it.
"use client"

import { Key, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"

/** The reset dialog's footer: Cancel and Reset Password until the reset succeeds, then a single Done. */
export default function ResetFooter({
  success,
  loading,
  onClose,
  onReset,
}: {
  success: boolean
  loading: boolean
  onClose: () => void
  onReset: () => void
}) {
  return (
    <DialogFooter className="gap-3 mt-6">
      {!success ? (
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-border hover:bg-muted"
          >
            Cancel
          </Button>
          <Button
            onClick={onReset}
            disabled={loading}
            className="transition-colors transform hover:scale-[1.02] disabled:"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating Password...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span>Reset Password</span>
              </div>
            )}
          </Button>
        </>
      ) : (
        <Button
          onClick={onClose}
          className="w-full h-12 transition-colors transform hover:scale-[1.02] text-white font-semibold"
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          <span>Done</span>
        </Button>
      )}
    </DialogFooter>
  )
}
