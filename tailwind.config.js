/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          50: "#f2f7f0",
          100: "#e2ede0",
          200: "#c5dcc2",
          300: "#a0c69a",
          400: "#7bab73",
          500: "#5c9153",
          600: "#4a7943",
          700: "#3c6237",
          800: "#324f2e",
          900: "#294126",
        },
        neutral: {
          50: "#fafaf9",
          100: "#f4f3f1",
          200: "#e7e5e1",
          300: "#d3d0c9",
          400: "#a8a59d",
          500: "#898781",
          600: "#6b6960",
          700: "#524f48",
          800: "#37352f",
          900: "#211f1b",
        },
        success: { 50: "#eafaf1", 500: "#1baf7a", 700: "#0e8a5c" },
        danger: { 50: "#fdecec", 500: "#e34948", 700: "#b7302f" },
        warning: { 50: "#fff6e5", 500: "#eda100", 700: "#b57c00" },
      },
      borderRadius: {
        card: "18px",
        pill: "999px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(33,31,27,0.04), 0 4px 12px rgba(33,31,27,0.06)",
        softHover: "0 2px 4px rgba(33,31,27,0.06), 0 8px 20px rgba(33,31,27,0.10)",
      },
    },
  },
  plugins: [],
}
