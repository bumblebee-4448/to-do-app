import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            {
              name: 'vendor-data',
              test: /node_modules[\\/](@tanstack|axios|zod|zustand)[\\/]/,
            },
            {
              name: 'vendor-ui',
              test: /node_modules[\\/](@radix-ui|@hookform|react-hook-form|react-day-picker|date-fns|lucide-react|sonner)[\\/]/,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
  },
});
