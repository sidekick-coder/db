import { resolve } from 'path'
import { Drive } from '../drive/types.js'
import { defineProvider } from '../provider/defineProvider.js'
import * as YAML from '@/utils/yaml.js'
import { DataProvider } from '../provider/types.js'
import { queryArray } from '../provider/queryArray.js'

import omit from 'lodash/omit'
import pick from 'lodash/pick'

interface Config {
    path: string
    drive: Drive
    include?: string[]
}

export const provider = defineProvider((config: Config) => {
    const { path, drive } = config

    const list: DataProvider['list'] = async (options) => {
        const where = options?.where || {}
        const exclude = options?.exclude || config.include || ['$raw', '$filename', '$body']
        const include = options?.include || config.include || []

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

            properies['$raw'] = raw
            properies['$filename'] = filename
            properies['$body'] = body || ''

            result.push(properies)
        }

        let items = queryArray(result, where)

        if (include.length) {
            items = items.map((item) => pick(item, include))
        }

        if (exclude.length && !include.length) {
            items = items.map((item) => omit(item, exclude))
        }

        return items
    }

    const create: DataProvider['create'] = async (data) => {
        const body = data.body || ''
        const filename = resolve(path, `${data.id}.md`)
        const frontmatter = YAML.stringify(data)
        const content = `---\n${frontmatter}---\n${body}`

        await drive.write(filename, content)

        return data
    }

    const update: DataProvider['update'] = async (data, where) => {
        const items = await list({ where })

        for (const item of items) {
            const filename = resolve(path, `${item.id}.md`)
            const newData = { ...item, ...data }
            const body = newData.body || item.body

            const content = `---\n${YAML.stringify(newData)}---\n${body}`

            await drive.write(filename, content)
        }

        return { count: items.length }
    }

    const destroy: DataProvider['destroy'] = async (where) => {
        const items = await list({ where, include: ['$filename'] })

        console.log(items)

        for (const item of items) {
            await drive.destroy(item.$filename)
        }

        return { count: items.length }
    }

    return {
        list,
        create,
        update,
        destroy,
    }
})
