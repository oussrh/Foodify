// components/restaurant-form/currencies.ts
// The currencies a restaurant can price in, as the two settings forms list them, with the
// symbol the form fills in when one is picked.
export const CURRENCIES = [
  { code: "USD", symbol: "$", label: "🇺🇸 USD - US Dollar" },
  { code: "EUR", symbol: "€", label: "🇪🇺 EUR - Euro" },
  { code: "GBP", symbol: "£", label: "🇬🇧 GBP - British Pound" },
  { code: "CAD", symbol: "C$", label: "🇨🇦 CAD - Canadian Dollar" },
  { code: "JPY", symbol: "¥", label: "🇯🇵 JPY - Japanese Yen" },
  { code: "AUD", symbol: "A$", label: "🇦🇺 AUD - Australian Dollar" },
  { code: "CHF", symbol: "CHF", label: "🇨🇭 CHF - Swiss Franc" },
  { code: "CNY", symbol: "¥", label: "🇨🇳 CNY - Chinese Yuan" },
  { code: "INR", symbol: "₹", label: "🇮🇳 INR - Indian Rupee" },
  { code: "BRL", symbol: "R$", label: "🇧🇷 BRL - Brazilian Real" },
  { code: "MXN", symbol: "$", label: "🇲🇽 MXN - Mexican Peso" },
  { code: "ZAR", symbol: "R", label: "🇿🇦 ZAR - South African Rand" },
] as const

/** The symbol of a listed currency; an unlisted code is its own symbol. */
export function currencySymbolFor(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol || code
}
