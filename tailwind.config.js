/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        'accent-text': 'var(--color-accent-text)',
        'theme-bg': 'var(--color-bg)',
        'theme-card': 'var(--color-bg-card)',
        'theme-text': 'var(--color-text)',
        'theme-muted': 'var(--color-text-muted)',
        'theme-border': 'var(--color-border)',
        'theme-border-hover': 'var(--color-border-hover)',
      },
      animation: {
        'bounce-slight': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
