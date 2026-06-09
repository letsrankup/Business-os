import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],

  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}"
  ],

  theme: {
    extend: {
      colors: {
        background: "#0B0F19",
        foreground: "#FFFFFF",

        primary: {
          DEFAULT: "#00E5FF",
          foreground: "#FFFFFF"
        },

        secondary: {
          DEFAULT: "#151C2C",
          foreground: "#FFFFFF"
        },

        card: {
          DEFAULT: "#101827",
          foreground: "#FFFFFF"
        },

        border: "#1F2937",
        muted: "#6B7280",
        success: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B"
      },

      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px"
      },

      boxShadow: {
        glow: "0 0 25px rgba(0,229,255,.35)"
      }
    }
  },

  plugins: []
};

export default config;
