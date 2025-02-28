import path from 'path'
import { FilesystemOptionsPath } from './types.js'

export function createPathNode(): FilesystemOptionsPath {
    return {
        resolve: (...args: string[]) => path.resolve(...args),
        join: (...args: string[]) => path.join(...args),
        dirname: (args: string) => path.dirname(args),
        basename: (args: string) => path.basename(args),
    }
}
