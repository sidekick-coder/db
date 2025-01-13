import { addIgnoreFile, config as sidekick } from '@sidekick-coder/eslint-config'
import { resolve } from 'path'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default [
    ...sidekick,
    addIgnoreFile(resolve(__dirname, '.gitignore')),
    {
        rules: {
            'markdown/no-missing-label-refs': 'off',
        },
    },
]
