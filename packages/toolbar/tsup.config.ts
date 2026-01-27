import { sassPlugin } from 'esbuild-sass-plugin';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  esbuildPlugins: [
    sassPlugin({
      type: 'local-css',
    }),
  ],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  injectStyle: true,
});
