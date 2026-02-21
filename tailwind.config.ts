import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        candleGold: "#FFD700",
        blushPink: "#F9C6D3",
        deepPlum: "#5B2245",
        creamyIvory: "#FFF8F0",
        sageGreen: "#B7D6B7",
        charcoalBlack: "#232323",
        glowPeach: "#FFB88C",
      },
      fontFamily: {
        heading: ["Quicksand", "sans-serif"],
        body: ["Montserrat", "sans-serif"],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #FFD700 0%, #F9C6D3 50%, #5B2245 100%)',
        'footer-gradient': 'linear-gradient(90deg, #5B2245 0%, #FFD700 100%)',
      },
      boxShadow: {
        card: '0 4px 24px 0 rgba(91,34,69,0.08)',
      },
      borderRadius: {
        xl: '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
