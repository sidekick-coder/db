import { Filesystem } from '../filesystem/createFilesystem.js'
import { createDate } from './createDate.js'
import { createIncremental } from './createIncremental.js'
import { createUuid } from './createUuid.js'
import { Strategy } from './types.js'

interface Options {
    root: string
    filesystem: Filesystem
}

export function createStrategies(options: Options): Strategy[] {
    const { filesystem, root } = options

    return [
        createIncremental(filesystem, filesystem.path.resolve(root, '.db', 'incremental.json')),
        createDate(),
        createUuid(),
    ]
}
