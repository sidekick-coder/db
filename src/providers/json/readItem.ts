import { Drive } from '@/core/drive/types.js'

interface Options {
    drive: Drive
    filename: string
}

export async function readItem(options: Options) {
    const { drive, filename } = options
    const content = await drive.read(filename)

    const raw = content
    const body = content

    const properies: any = {
        id: filename.replace(/\.md$/, ''),
    }

    properies['_raw'] = raw
    properies['_filename'] = filename

    Object.assign(properies, JSON.parse(body))

    return properies
}
