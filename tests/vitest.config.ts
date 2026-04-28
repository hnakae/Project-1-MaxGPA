import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

console.log('__dirname:', __dirname);
console.log('resolved @:', path.resolve(__dirname, '../'));
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../'),
    },
  },
});