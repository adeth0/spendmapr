import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Dark theme tokens ─────────────────────────────────────────────
        app: {
          bg:      '#0b0f17',   // page background
          card:    '#111827',   // card / surface
          raised:  '#161d2b',   // elevated cards
          input:   '#0f1623',   // input fields
          border:  '#1f2937',   // default borders
          subtle:  '#131a26',   // subtle borders
        },
        // ── Accent ───────────────────────────────────────────────────────
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      boxShadow: {
        'dark-sm':  '0 2px 8px rgba(0,0,0,0.4)',
        'dark-md':  '0 4px 24px rgba(0,0,0,0.5)',
        'dark-lg':  '0 8px 40px rgba(0,0,0,0.6)',
        'glow-sm':  '0 0 16px rgba(59,130,246,0.18)',
        'glow-md':  '0 0 32px rgba(59,130,246,0.25)',
      },
      fontFamily: {
        sans: [
          "SF Pro Display", "SF Pro Text", "ui-sans-serif",
          "system-ui", "-apple-system", "BlinkMacSystemFont",
          '"Segoe UI"', "sans-serif",
        ],
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #1d4ed8 0%, #1e1b4b 50%, #0b0f17 100%)',
        'card-gradient': 'linear-gradient(145deg, #1c2840 0%, #111827 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
