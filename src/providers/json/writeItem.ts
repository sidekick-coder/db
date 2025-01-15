import { Drive } from '@/core/drive/types.js'

interface Options {
    drive: Drive
    filename: string
    data: any
}

export async function writeItem(options: Options) {
    const { drive, filename, data } = options

    await drive.write(filename, JSON.stringify(data, null, 4))
}
