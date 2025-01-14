import { Drive } from './types.js'
import { promises as fs } from 'fs'

export const drive: Drive = {
    list: (path) => {
        return fs.readdir(path)
    },
    read: (path) => {
        return fs.readFile(path, 'utf-8')
    },
    write: (path, content) => {
        return fs.writeFile(path, content, 'utf-8')
    },
    destroy: (path) => {
        return fs.rm(path)
    },
}
