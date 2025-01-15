#! /usr/bin/env node
import { dirname, resolve } from 'path'
import { register } from 'tsx/esm/api'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const unregister = register({
    tsconfig: resolve(__dirname, '../tsconfig.json'),
})

import(resolve(__dirname, '../src/cli.ts'))

process.on('exit', unregister)
