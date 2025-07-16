import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#16a34a", // Tailwind green-600
        "primary-foreground": "#ffffff",
        destructive: "#ef4444", // red-500
        "destructive-foreground": "#ffffff",
        accent: "#f3f4f6",
        "accent-foreground": "#1f2937",
        secondary: "#e5e7eb",
        "secondary-foreground": "#1f2937",
        muted: "#f9fafb",
        "muted-foreground": "#6b7280",
      },
    },
  },
  plugins: [],
} satisfies Config;
