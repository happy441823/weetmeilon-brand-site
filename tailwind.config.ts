import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#100019",
        plum: {
          950: "#13001f",
          900: "#1d0630",
          850: "#28103d",
          800: "#32164e",
          700: "#4a1f72",
          600: "#6e2ca0"
        },
        mint: {
          300: "#90ffe7",
          400: "#53f0d0",
          500: "#28d9bb"
        },
        aura: "#f7ecff"
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Microsoft YaHei",
          "sans-serif"
        ]
      },
      boxShadow: {
        glow: "0 0 42px rgba(83, 240, 208, 0.22)",
        purple: "0 24px 80px rgba(74, 31, 114, 0.36)"
      },
      backgroundImage: {
        "mint-gradient": "linear-gradient(135deg, #90ffe7 0%, #53f0d0 46%, #bca4ff 100%)",
        "hero-radial":
          "radial-gradient(circle at 20% 20%, rgba(83,240,208,0.22), transparent 30%), radial-gradient(circle at 82% 10%, rgba(188,164,255,0.28), transparent 24%), linear-gradient(140deg, #13001f 0%, #24103a 52%, #100019 100%)"
      }
    }
  },
  plugins: []
};

export default config;
