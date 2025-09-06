/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/layout/**/*.{js,ts,jsx,tsx,mdx}',
    './src/context/**/*.{js,ts,jsx,tsx,mdx}',
    './src/icons/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      zIndex: {
        '99999': '99999',
      },
      maxWidth: {
        '(--breakpoint-2xl)': '1536px',
      },
    },
  },
  plugins: [],
}