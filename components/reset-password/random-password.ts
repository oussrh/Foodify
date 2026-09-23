// components/reset-password/random-password.ts
// The five-point score the reset dialog reports for the temporary password it hands out. The
// password itself comes from lib/password.ts (`crypto.getRandomValues`). It used to be made here
// with Math.random, under a dialog that told the admin it was cryptographically random.

/** A 0-5 score for the reset dialog: one point each for 12+ characters, a capital, a small letter, a digit and a symbol. */
export function getPasswordStrength(password: string) {
  let score = 0
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}
