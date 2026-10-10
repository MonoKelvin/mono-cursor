import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/react.tsx',
    vue: 'src/vue.ts',
    solid: 'src/solid.ts',
  },
  format: ['cjs', 'esm', 'iife'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  outDir: 'dist',
  platform: 'browser',
  target: 'es2020',
  name: 'MonoCursor',
  treeshake: false,
  define: {
    'process.env.NODE_ENV': '"production"',
  },
})
