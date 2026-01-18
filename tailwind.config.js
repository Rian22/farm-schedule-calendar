/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        planned: "#3b82f6",
        ongoing: "#f59e0b",
        completed: "#22c55e",
        cancelled: "#ef4444"
      }
    }
  },
  plugins: []
};
