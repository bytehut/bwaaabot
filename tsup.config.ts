import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts'],
  format: ['esm'],
  target: 'es2022',
  outDir: 'dist',
  dts: true,
  bundle: false,
  splitting: false,
  clean: true
});