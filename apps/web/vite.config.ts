import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'agent-feedback': path.resolve(__dirname, '../../packages/toolbar/src/index.ts'),
    },
  },
});
