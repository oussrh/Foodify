"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { resetClientPassword } from "@/app/actions/client-actions";

export default function ResetPasswordButton({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    await resetClientPassword(id, "newpassword123");
    setLoading(false);
    alert('Password reset to "newpassword123"');
  };

  return (
    <span
      onClick={handleClick}
      className={`flex items-center gap-2 w-full ${className} ${
 loading ? "opacity-50 pointer-events-none" : "cursor-pointer"
 }`}
    >
      <RotateCcw className="h-4 w-4" />
      <span>Reset Password</span>
    </span>
  );
}
