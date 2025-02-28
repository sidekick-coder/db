import { createFilesystem } from './createFilesystem.js'
import { createFsFake } from './createFsFake.js'
import { createPathFake } from './createPathFake.js'

export function createFilesystemFake() {
    return createFilesystem({
        fs: createFsFake(),
        path: createPathFake(),
    })
}
