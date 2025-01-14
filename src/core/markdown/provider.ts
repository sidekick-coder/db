import { resolve } from 'path'
import { Drive } from '../drive/types.js'
import { defineProvider } from '../provider/defineProvider.js'
import * as YAML from '@/utils/yaml.js'
import { DataProvider } from '../provider/types.js'
import { queryArray } from '../provider/queryArray.js'

interface Config {
    path: string
    drive: Drive
    include?: string[]
}

function exerpt(content: string, length = 100) {
    if (content.length <= length) {
        return content
    }

    return content.slice(0, 100) + '...'
}

export const provider = defineProvider((config: Config) => {
    const { path, drive } = config

    const include = config.include || []

    const list: DataProvider['list'] = async (options) => {
        const where = options?.where || {}

        const files = await drive.list(path)
        const result = [] as any[]

        for (const file of files) {
            const filename = resolve(path, file)
            const content = await drive.read(filename)

            const raw = content
            let body = content
            const properies: any = {
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

            if (include.includes('fullbody')) {
                properies['fullbody'] = body
            }

            properies.exerpt = exerpt(body)

            result.push(properies)
        }

        return queryArray(result, where)
    }

    const create: DataProvider['create'] = async (data) => {
        const body = data.body || ''
        const filename = resolve(path, `${data.id}.md`)
        const frontmatter = YAML.stringify(data)
        const content = `---\n${frontmatter}---\n${body}`

        await drive.write(filename, content)

        return data
    }

    return {
        list,
        create,
    }
})
