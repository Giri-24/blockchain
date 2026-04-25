/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        chain: {
          50:  "#f0f9ff",
          100: "#e0f2fe",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          900: "#0c4a6e",
        },
        trust: {
          primary:  "#0f172a", // Navy 900
          accent:   "#10b981", // Emerald 500
          subtle:   "#64748b", // Slate 500
          bg:       "#ffffff", // White
          card:     "#ffffff", // Card 
          border:   "#f1f5f9", // Slate 100
          text:     "#0f172a", // Main text
          muted:    "#94a3b8", // Slate 400
        },
      },
      fontFamily: {
        mono:    ["'JetBrains Mono'", "monospace"],
        display: ["'Orbitron'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
      },
      animation: {
        "pulse-slow":    "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow":          "glow 2s ease-in-out infinite alternate",
        "slide-in":      "slideIn 0.4s ease-out",
        "fade-up":       "fadeUp 0.5s ease-out",
        "scan":          "scan 2s linear infinite",
      },
      keyframes: {
        glow: {
          "0%":   { boxShadow: "0 0 5px #00ff88, 0 0 10px #00ff88" },
          "100%": { boxShadow: "0 0 20px #00ff88, 0 0 40px #00ff88, 0 0 80px #00ff88" },
        },
        slideIn: {
          "0%":   { transform: "translateX(-20px)", opacity: 0 },
          "100%": { transform: "translateX(0)",     opacity: 1 },
        },
        fadeUp: {
          "0%":   { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)",    opacity: 1 },
        },
        scan: {
          "0%":   { top: "0%" },
          "100%": { top: "100%" },
        },
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px)",
        "cyber-gradient": "linear-gradient(135deg, #050d1a 0%, #0a1628 50%, #050d1a 100%)",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
    },
  },
  plugins: [],
};
