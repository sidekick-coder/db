#! /usr/bin/env node
import { createRequire } from 'module'
import path from 'path'
import { register } from 'tsx/esm/api'

const require = createRequire(import.meta.url)

require('dotenv').config({
    path: path.join(import.meta.dirname, '.env'),
})

if (process.env.NODE_ENV !== 'development') {
    require('./dist/cli.js')
}

if (process.env.NODE_ENV === 'development') {
    register({
        tsconfig: path.join(import.meta.dirname, 'tsconfig.json'),
    })

    require('./src/cli.ts')
}
