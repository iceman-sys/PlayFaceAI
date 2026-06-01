import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { generatePortraitApiPlugin } from './server/vite-plugin';

export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
  },
  plugins: [react(), generatePortraitApiPlugin()].filter(Boolean),
  optimizeDeps: {
    include: ['@vladmandic/face-api', '@tensorflow/tfjs'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
