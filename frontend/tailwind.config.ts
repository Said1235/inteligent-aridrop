import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        surface: "var(--surface)",
        sunk: "var(--sunk)",
        ink: "var(--ink)",
        muted: "var(--ink-muted)",
        faint: "var(--ink-faint)",
        rule: "var(--rule)",
        "rule-strong": "var(--rule-strong)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
        pending: "var(--pending)",
        "pending-soft": "var(--pending-soft)",
        approved: "var(--approved)",
        "approved-soft": "var(--approved-soft)",
        declined: "var(--declined)",
        "declined-soft": "var(--declined-soft)",
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        display: ["clamp(2.5rem, 6vw, 4.25rem)", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
        title: ["clamp(1.75rem, 3.4vw, 2.5rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        section: ["clamp(1.25rem, 2vw, 1.5rem)", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      },
      borderRadius: { xs: "2px", sm: "3px", DEFAULT: "4px", md: "6px" },
      maxWidth: { prose: "68ch", shell: "78rem" },
      boxShadow: {
        raise: "0 1px 0 var(--rule-strong)",
        panel: "0 1px 2px rgba(19, 26, 23, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
