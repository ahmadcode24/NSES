import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg, #FFFFFF)",
        surface: "var(--color-surface, #F7F8FA)",
        "text-primary": "var(--color-text-primary, #111827)",
        "text-secondary": "var(--color-text-secondary, #6B7280)",
        accent: {
          DEFAULT: "var(--color-accent, #2563EB)",
          hover: "var(--color-accent-hover, #1D4ED8)",
        },
        success: "var(--color-success, #16A34A)",
        warning: "var(--color-warning, #D97706)",
        error: "var(--color-error, #DC2626)",
        "muted-badge": "var(--color-muted-badge, #9CA3AF)",
        border: "var(--color-border, #E5E7EB)",
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["24px", { lineHeight: "32px" }],
        "2xl": ["32px", { lineHeight: "40px" }],
        "3xl": ["40px", { lineHeight: "48px" }],
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
        16: "64px",
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        full: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
