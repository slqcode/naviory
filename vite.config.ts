import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: './public/manifest.json',
      additionalInputs: [
        'src/newtab/index.html',
        'src/newtab/style-lab/index.html',
        'src/popup/index.html',
        'src/options/index.html',
      ],
      // 跳过 manifest 网络验证，避免本地构建因网络超时失败
      skipManifestValidation: true,
      disableAutoLaunch: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
