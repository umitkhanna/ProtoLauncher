/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        surface: {
          DEFAULT: "rgb(9 9 11)",
          raised: "rgb(24 24 27)",
        },
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgba(139, 92, 246, 0.2), transparent)",
        "cta-radial":
          "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(139, 92, 246, 0.22), transparent)",
        "conic-aurora":
          "conic-gradient(from 220deg at 50% 50%, rgba(139,92,246,0.0) 0deg, rgba(139,92,246,0.35) 80deg, rgba(34,211,238,0.25) 180deg, rgba(217,70,239,0.25) 270deg, rgba(139,92,246,0.0) 360deg)",
      },
      boxShadow: {
        glass:
          "0 0 0 1px rgba(255,255,255,0.06), 0 24px 80px -32px rgba(0,0,0,0.65)",
        glow: "0 0 0 1px rgba(139, 92, 246, 0.25), 0 20px 50px -20px rgba(99, 102, 241, 0.35)",
        "ring-violet":
          "0 0 0 1px rgba(139, 92, 246, 0.35), 0 0 40px -8px rgba(139, 92, 246, 0.4)",
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite 0.5s",
        shimmer: "shimmer 2.4s linear infinite",
        "spin-slow": "spin 18s linear infinite",
        "pulse-soft": "pulseSoft 4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
