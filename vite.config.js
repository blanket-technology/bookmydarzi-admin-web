import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Never ship source maps to production - they expose the full readable
    // source (including comments and internal logic) of an admin panel that
    // handles orders, payments and PII. Vite already defaults this off, but
    // we set it explicitly so it can't be turned on by accident.
    sourcemap: false,
  },
  // Vite 8 minifies with oxc (not esbuild), so console/debugger stripping must
  // be configured here - an `esbuild.drop` is ignored by the oxc pipeline.
  // This drops all console.* and debugger statements from the production
  // bundle so debug logging never reaches an end user's devtools.
  oxc: {
    drop: ["console", "debugger"],
  },
})
