import fs from 'fs'
import { FilesystemOptionsFs } from './types.js'
import { tryCatch } from '@/utils/tryCatch.js'

export function createFsNode(): FilesystemOptionsFs {
    const exists: FilesystemOptionsFs['exists'] = async (path: string) => {
        const [, error] = await tryCatch(() => fs.promises.access(path))

        return error ? false : true
    }

    const existsSync: FilesystemOptionsFs['existsSync'] = (path: string) => {
        const [, error] = tryCatch.sync(() => fs.accessSync(path))

        return error ? false : true
    }

    const read: FilesystemOptionsFs['read'] = async (path: string) => {
        const [content, error] = await tryCatch(() => fs.promises.readFile(path))

        if (error) {
            return null
        }

        return new Uint8Array(content)
    }

    const readSync: FilesystemOptionsFs['readSync'] = (path: string) => {
        const [content, error] = tryCatch.sync(() => fs.readFileSync(path))

        if (error) {
            return null
        }

        return new Uint8Array(content)
    }

    const readdir: FilesystemOptionsFs['readdir'] = async (path: string) => {
        const [files, error] = await tryCatch(() => fs.promises.readdir(path))

        return error ? [] : files
    }

    const readdirSync: FilesystemOptionsFs['readdirSync'] = (path: string) => {
        const [files, error] = tryCatch.sync(() => fs.readdirSync(path))

        return error ? [] : files
    }

    const write: FilesystemOptionsFs['write'] = async (path: string, content: Uint8Array) => {
        const [, error] = await tryCatch(() => fs.promises.writeFile(path, content))

        if (error) {
            throw error
        }
    }

    const writeSync: FilesystemOptionsFs['writeSync'] = (path: string, content: Uint8Array) => {
        const [, error] = tryCatch.sync(() => fs.writeFileSync(path, content))

        if (error) {
            throw error
        }
    }

    const mkdir: FilesystemOptionsFs['mkdir'] = async (path: string) => {
        const [, error] = await tryCatch(() => fs.promises.mkdir(path))

        if (error) {
            throw error
        }
    }

    const mkdirSync: FilesystemOptionsFs['mkdirSync'] = (path: string) => {
        const [, error] = tryCatch.sync(() => fs.mkdirSync(path))

        if (error) {
            throw error
        }
    }

    const remove: FilesystemOptionsFs['remove'] = async (path: string) => {
        const [, error] = await tryCatch(() => fs.promises.rm(path, { recursive: true }))

        if (error) {
            throw error
        }
    }

    const removeSync: FilesystemOptionsFs['removeSync'] = (path: string) => {
        const [, error] = tryCatch.sync(() => fs.rmSync(path, { recursive: true }))

        if (error) {
            throw error
        }
    }

    return {
        exists,
        existsSync,

        read,
        readSync,

        readdir,
        readdirSync,

        write,
        writeSync,

        mkdir,
        mkdirSync,

        remove,
        removeSync,
    }
}
