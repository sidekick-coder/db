import { defineConfig } from 'tsup'
import path from 'path'

export default defineConfig({
    entry: ['src/**/**/*.ts'],
    splitting: false,
    sourcemap: true,
    clean: true,
    format: 'esm',
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
})
