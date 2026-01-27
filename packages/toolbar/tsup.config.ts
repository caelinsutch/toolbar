import { sassPlugin } from 'esbuild-sass-plugin';
import postcss from 'postcss';
import postcssModulesPlugin from 'postcss-modules';
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
  ],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
