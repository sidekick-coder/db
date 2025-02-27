import { dirname } from 'path'
import { Drive } from './types.js'
import fs from 'fs'

export const drive: Drive = {
    exists: async (path) => {
        try {
            await fs.promises.stat(path)

            return true
        } catch (error) {
            return false
        }
    },
    existsSync: (path) => {
        try {
            fs.statSync(path)

            return true
        } catch (error) {
            return false
        }
    },
    list: async (path, options) => {
        if (!(await drive.exists(path))) {
            return []
        }

        const all = await fs.promises.readdir(path, { withFileTypes: true })

        if (options?.onlyFiles) {
            return all.filter((item) => item.isFile()).map((item) => item.name)
        }

        if (options?.onlyDirs) {
            return all.filter((item) => item.isDirectory()).map((item) => item.name)
        }

        return all.map((item) => item.name)
    },
    listSync: (path, options) => {
        if (!drive.existsSync(path)) {
            return []
        }

        const all = fs.readdirSync(path, { withFileTypes: true })

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

        const stat = await fs.promises.stat(path)

        if (!stat.isFile()) {
            throw new Error(`entry not file ${path}`)
        }

        return fs.promises.readFile(path, 'utf-8')
    },
    readSync: (path) => {
        if (!drive.existsSync(path)) {
            throw new Error(`entry not found ${path}`)
        }

        const stat = fs.statSync(path)

        if (!stat.isFile()) {
            throw new Error(`entry not file ${path}`)
        }

        return fs.readFileSync(path, 'utf-8')
    },
    write: async (path, content, options) => {
        if (options?.recursive) {
            await drive.mkdir(dirname(path), { recursive: true })
        }

        return fs.promises.writeFile(path, content, 'utf-8')
    },
    writeSync: (path, content, options) => {
        if (options?.recursive) {
            const parent = dirname(path)

            drive.mkdirSync(parent, { recursive: true })
        }

        return fs.writeFileSync(path, content, 'utf-8')
    },
    mkdir: async (path, options) => {
        if (await drive.exists(path)) return

        if (options?.recursive) {
            await drive.mkdir(dirname(path))
        }

        return fs.promises.mkdir(path)
    },
    mkdirSync: (path, options) => {
        if (drive.existsSync(path)) return

        if (options?.recursive) {
            const parent = dirname(path)

            drive.mkdirSync(parent, { recursive: true })
        }

        return fs.mkdirSync(path)
    },
    destroy: (path) => {
        return fs.promises.rm(path, { recursive: true })
    },
    destroySync: (path) => {
        return fs.rmSync(path, { recursive: true })
    },
}
