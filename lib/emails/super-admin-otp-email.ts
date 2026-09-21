/** HTML body of the admin sign-in code mail; the ten minutes it states is OTP_TTL_MS in lib/otp-request, so change both together. */
export function superAdminOtpEmail(code: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <header style="text-align:center; padding-bottom:16px; border-bottom:1px solid #e5e7eb;">
        <img src="https://placehold.co/150x40?text=Foodify" alt="Foodify Logo" style="display:block; margin:0 auto;" />
        <h2 style="color:#f97316; margin-top:8px;">Foodify Admin Login</h2>
      </header>
      <main style="padding:24px 0;">
        <p>Hello,</p>
        <p>Use the following verification code to sign in to your admin dashboard:</p>
        <div style="background-color:#f3f4f6; padding:20px; border-radius:8px; text-align:center; margin:20px 0;">
          <span style="font-size:32px; font-weight:bold; letter-spacing:4px; color:#1f2937;">${code}</span>
        </div>
        <p>This code will expire in 10 minutes. If you didn't request this email, you can safely ignore it.</p>
      </main>
      <footer style="text-align:center; font-size:12px; color:#6b7280; border-top:1px solid #e5e7eb; padding-top:16px;">
        &copy; ${new Date().getFullYear()} Foodify
      </footer>
    </div>
  `
}
