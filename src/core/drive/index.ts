import { resolve } from 'path'
import { list } from './list.js'
import { read } from './read.js'
import { Drive } from './types.js'

export const drive: Drive = {
    list: (path) => {
        const result = resolve(process.cwd(), path)

        return list(result)
    },
    read: (path) => {
        const result = resolve(process.cwd(), path)

        return read(result)
    },
}
