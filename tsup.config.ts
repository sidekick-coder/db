import { defineConfig } from 'tsup'
import path from 'path'

export default defineConfig({
    entry: ['src/**/**/*.ts'],
    format: ['cjs', 'esm'],
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    splitting: false,
    sourcemap: true,
    clean: true,
    treeshake: true,
})
