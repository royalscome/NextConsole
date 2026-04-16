import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dts from 'vite-plugin-dts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  server: {
    open: '/examples/index.html',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'NextConsole',
      formats: ['es', 'umd'],
      fileName: (format) => `nextconsole.${format}.js`,
    },
    minify: 'esbuild',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        exports: 'named',
      },
    },
    target: 'es2020',
    sourcemap: true,
  },
});
