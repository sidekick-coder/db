import { Drive } from '@/core/drive/types.js'
import * as YAML from '@/utils/yaml.js'

interface Options {
    drive: Drive
    filename: string
}

export async function readItem(options: Options) {
    const { drive, filename } = options
    const content = await drive.read(filename)

    const raw = content
    let body = content

    const properies: any = {
        id: filename.replace(/\.md$/, ''),
    }

    if (content.startsWith('---')) {
        const [, frontmatter, rest] = content.split('---')

        Object.assign(properies, YAML.parse(frontmatter))

        body = rest.trim()
    }

    properies['_raw'] = raw
    properies['_filename'] = filename
    properies['_body'] = body || ''

    return properies
}
