import { sassPlugin } from 'esbuild-sass-plugin';
import postcss from 'postcss';
import postcssModulesPlugin from 'postcss-modules';
import { defineConfig, type Options } from 'tsup';

// Factory function to create fresh plugin instances for each build
function createSassPlugins() {
  return [
    sassPlugin({
      filter: /\.module\.scss$/,
      type: 'style',
      async transform(source, _resolveDir, filePath) {
        let cssModuleExports = {};
        const { css } = await postcss([
          postcssModulesPlugin({
            getJSON(_cssFilename, json) {
              cssModuleExports = json;
            },
          }),
        ]).process(source, { from: filePath, map: false });

        return {
          contents: css,
          pluginData: { exports: JSON.stringify(cssModuleExports) },
        };
      },
    }),
    sassPlugin({
      filter: /\.scss$/,
      type: 'style',
    }),
  ];
}

// ESM build for bundlers (React as peer dependency)
const esmConfig: Options = {
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  esbuildPlugins: createSassPlugins(),
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
};

// IIFE build for CDN (React bundled, self-initializing)
const cdnConfig: Options = {
  entry: { cdn: 'src/cdn.tsx' },
  format: ['iife'],
  globalName: 'AgentFeedback',
  sourcemap: true,
  minify: true,
  noExternal: [/.*/], // Bundle all dependencies including React
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  esbuildPlugins: createSassPlugins(),
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
};

export default defineConfig([esmConfig, cdnConfig]);
