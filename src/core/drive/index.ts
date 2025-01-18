import { Drive } from './types.js'
import { promises as fs } from 'fs'

export const drive: Drive = {
    exists: async (path) => {
        try {
            await fs.stat(path)

            return true
        } catch (error) {
            return false
        }
    },
    list: async (path, options) => {
        if (!(await drive.exists(path))) {
            throw new Error(`entry not found ${path}`)
        }

        const all = await fs.readdir(path, { withFileTypes: true })

        if (options?.onlyFiles) {
            return all.filter((item) => item.isFile()).map((item) => item.name)
        }

        if (options?.onlyDirs) {
            return all.filter((item) => item.isDirectory()).map((item) => item.name)
        }

        return all.map((item) => item.name)
    },
    read: async (path) => {
        if (!(await drive.exists(path))) {
            throw new Error(`entry not found ${path}`)
        }

        const stat = await fs.stat(path)

        if (!stat.isFile()) {
            throw new Error(`entry not file ${path}`)
        }

        return fs.readFile(path, 'utf-8')
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
