import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Map the '@' alias to the 'src' directory
      '@': path.resolve(__dirname, './src'),
    },
  },
});