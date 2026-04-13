import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F8FA",
        foreground: "#111827",
        line: "#E5E7EB",
        surface: "#FBFBFC",
        slatewarm: "#F7F8FA",
        brand: {
          50: "#EEF4FF",
          100: "#E4EDFF",
          300: "#A8C0FF",
          500: "#5B82F6",
          600: "#3F69DF"
        }
      },
      boxShadow: {
        soft: "0 24px 60px -34px rgba(15, 23, 42, 0.18)",
        card: "0 10px 30px -20px rgba(15, 23, 42, 0.10)",
        hover: "0 28px 60px -36px rgba(15, 23, 42, 0.16)"
      },
      fontFamily: {
        sans: ["SF Pro Display", "SF Pro Text", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top left, rgba(91, 130, 246, 0.12), transparent 34%), radial-gradient(circle at top right, rgba(255, 255, 255, 0.75), transparent 30%)"
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.22, 1, 0.36, 1)"
      }
    }
  },
  plugins: []
};

export default config;
