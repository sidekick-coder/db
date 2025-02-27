import { basename, dirname } from 'path'

import { FilesystemOptionsFs } from './types.js'

interface EntryFile {
    name: string
    path: string
    type: 'file'
    content: Uint8Array
}

interface EntryDirectory {
    name: string
    type: 'directory'
    path: string
}

type Entry = EntryFile | EntryDirectory

export function createFsFake(): FilesystemOptionsFs {
    const entries = new Map<string, Entry>()

    const existsSync: FilesystemOptionsFs['existsSync'] = (path: string) => {
        const result = entries.has(path)

        return result
    }
    const exists: FilesystemOptionsFs['exists'] = async (path: string) => {
        return existsSync(path)
    }

    const read: FilesystemOptionsFs['read'] = async (path: string) => {
        const entry = entries.get(path)

        if (!entry || entry.type !== 'file') {
            return null
        }

        return entry.content
    }

    const readSync: FilesystemOptionsFs['readSync'] = (path: string) => {
        const entry = entries.get(path)

        if (!entry || entry.type !== 'file') {
            return null
        }

        return entry.content
    }

    const readdir: FilesystemOptionsFs['readdir'] = async (path: string) => {
        const directory = entries.get(path)

        if (!directory || directory.type !== 'directory') {
            return []
        }

        const result = Array.from(entries.values())
            .filter((entry) => dirname(entry.path) === directory.path)
            .map((entry) => entry.name)

        return result
    }

    const readdirSync: FilesystemOptionsFs['readdirSync'] = (path: string) => {
        const directory = entries.get(path)

        if (!directory || directory.type !== 'directory') {
            return []
        }

        const result = Array.from(entries.values())
            .filter((entry) => dirname(entry.path) === directory.path)
            .map((entry) => entry.name)

        return result
    }

    const write: FilesystemOptionsFs['write'] = async (path: string, content: Uint8Array) => {
        entries.set(path, {
            name: basename(path),
            path,
            type: 'file',
            content,
        })
    }

    const writeSync: FilesystemOptionsFs['writeSync'] = (path: string, content: Uint8Array) => {
        entries.set(path, {
            name: basename(path),
            path,
            type: 'file',
            content,
        })
    }

    const mkdir: FilesystemOptionsFs['mkdir'] = async (path: string) => {
        entries.set(path, {
            name: basename(path),
            path,
            type: 'directory',
        })
    }

    const mkdirSync: FilesystemOptionsFs['mkdirSync'] = (path: string) => {
        entries.set(path, {
            name: basename(path),
            path,
            type: 'directory',
        })
    }

    const removeSync: FilesystemOptionsFs['removeSync'] = (path: string) => {
        const entry = entries.get(path)

        if (!entry) return

        const keys = [] as string[]

        if (entry?.type === 'directory') {
            Array.from(entries.keys())
                .filter((key) => key.startsWith(path))
                .forEach((key) => keys.push(key))
        }

        keys.forEach((key) => entries.delete(key))
    }
    const remove: FilesystemOptionsFs['remove'] = async (path: string) => {
        removeSync(path)
    }

    return {
        entries,

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
