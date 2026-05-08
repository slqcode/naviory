import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // 每个测试文件都加载 setup，用于 IndexedDB polyfill 等
    setupFiles: ['./tests/setup.ts'],
    // 只跑 tests/ 目录下的测试，避免误抓 src/ 下同名文件
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
  },
});
