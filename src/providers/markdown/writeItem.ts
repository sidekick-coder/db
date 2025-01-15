import { Drive } from '@/core/drive/types.js'
import * as YAML from '@/utils/yaml.js'

interface Options {
    drive: Drive
    filename: string
    data: any
}

export async function writeItem(options: Options) {
    const { drive, filename, data } = options
    const { body, ...properties } = data

    const content = `---\n${YAML.stringify(properties)}---\n${body || ''}`

    await drive.write(filename, content)
}
