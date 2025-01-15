import { Drive } from './types.js'
import { promises as fs } from 'fs'

export const drive: Drive = {
    list: async (path, options) => {
        const all = await fs.readdir(path, { withFileTypes: true })

        if (options?.onlyFiles) {
            return all.filter((item) => item.isFile()).map((item) => item.name)
        }

        if (options?.onlyDirs) {
            return all.filter((item) => item.isDirectory()).map((item) => item.name)
        }

        return all.map((item) => item.name)
    },
    read: (path) => {
        return fs.readFile(path, 'utf-8')
    },
    exists: async (path) => {
        try {
            await fs.stat(path)

            return true
        } catch (error) {
            return false
        }
    },
    write: (path, content) => {
        return fs.writeFile(path, content, 'utf-8')
    },
    mkdir: (path) => {
        return fs.mkdir(path)
    },
    destroy: (path) => {
        return fs.rm(path, { recursive: true })
    },
}
