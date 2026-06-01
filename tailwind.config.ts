import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        handwriting: ['var(--font-handwriting)', 'cursive'],
      },
      colors: {
        cream: 'var(--cream)',
        terracotta: 'var(--terracotta)',
        sage: 'var(--sage)',
        brown: 'var(--brown)',
        'warm-white': 'var(--warm-white)',
      },
    },
  },
  plugins: [],
} satisfies Config;
