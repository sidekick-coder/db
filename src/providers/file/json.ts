import { Drive } from '@/core/drive/types.js'
import { createFileProvider } from '../file/provider.js'

export function createJsonProvider(drive: Drive) {
    return createFileProvider({
        drive,
        ext: 'json',
        parse: JSON.parse,
        stringify: (contents) => JSON.stringify(contents, null, 4),
    })
}
