import { resolve } from 'path'
import { Drive } from '../drive/types.js'
import { defineProvider } from '../provider/defineProvider.js'
import * as YAML from '@/utils/yaml.js'

interface Config {
    path: string
    drive: Drive
    include?: string[]
}

export const provider = defineProvider((config: Config) => {
    const { path, drive } = config

    const include = config.include || []

    async function list() {
        const files = await drive.list(path)
        const result = [] as any[]

        for (const file of files) {
            const filename = resolve(path, file)
            const content = await drive.read(filename)

            const raw = content
            let body = content
            const properies = {
                id: file.replace(/\.md$/, ''),
            }

            if (content.startsWith('---')) {
                const [, frontmatter, rest] = content.split('---')

                Object.assign(properies, YAML.parse(frontmatter))

                body = rest.trim()
            }

            if (include.includes('raw')) {
                properies['_raw'] = raw
            }

            if (include.includes('filename')) {
                properies['_filename'] = filename
            }

            if (include.includes('body')) {
                properies['body'] = body
            }

            result.push(properies)
        }

        return result
    }

    return {
        list,
    }
})
