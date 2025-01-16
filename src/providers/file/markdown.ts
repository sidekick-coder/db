import { Drive } from '@/core/drive/types.js'
import { createFileProvider } from '../file/provider.js'
import { MD } from '@/core/parsers/index.js'

export function createMarkdownProvider(drive: Drive) {
    return createFileProvider({
        drive,
        ext: 'md',
        parse: MD.parse,
        stringify: (contents) => MD.stringify(contents),
    })
}
