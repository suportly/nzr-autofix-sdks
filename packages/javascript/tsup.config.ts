import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    outDir: 'dist',
  },
  {
    entry: ['src/integrations/react.tsx'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    outDir: 'dist/integrations',
    external: ['react'],
  },
  {
    entry: ['src/integrations/angular.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    outDir: 'dist/integrations',
    external: ['@angular/core'],
  },
])
