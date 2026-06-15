/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: "#12B2A6",
          dark: "#0C8D84",
          tint: "#E7F6F4",
          light: "#A3E2DE",
        },
        pink: {
          DEFAULT: "#E84B8C",
          safe: "#C9367A",
          hover: "#D03B7B",
        },
        brand: {
          blush: "#FCEFF4",
          cream: "#FFFCEF",
          ink: "#20262E",
          muted: "#5B6470",
          border: "#F0ECEF",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "sans-serif"],
        heading: ["var(--font-space-grotesk)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
