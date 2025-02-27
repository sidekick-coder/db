import fs from 'fs'
import { FilesystemOptionsFs } from './types.js'
import { tryCatch } from '@/utils/tryCatch.js'

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

const entries = new Map<string, Entry>()

export function createDefaultFs(): FilesystemOptionsFs {
    const exists: FilesystemOptionsFs['exists'] = async (path: string) => {
        return entries.has(path)
    }

    const existsSync: FilesystemOptionsFs['existsSync'] = (path: string) => {
        return entries.has(path)
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

        return Array.from(entries.values())
            .filter((entry) => entry.path.startsWith(directory.path))
            .map((entry) => entry.name)
    }

    const readdirSync: FilesystemOptionsFs['readdirSync'] = (path: string) => {
        const directory = entries.get(path)

        if (!directory || directory.type !== 'directory') {
            return []
        }

        return Array.from(entries.values())
            .filter((entry) => entry.path.startsWith(directory.path))
            .map((entry) => entry.name)
    }

    const write: FilesystemOptionsFs['write'] = async (path: string, content: Uint8Array) => {
        entries.set(path, {
            name: path,
            path,
            type: 'file',
            content,
        })
    }

    const writeSync: FilesystemOptionsFs['writeSync'] = (path: string, content: Uint8Array) => {
        entries.set(path, {
            name: path,
            path,
            type: 'file',
            content,
        })
    }

    const mkdir: FilesystemOptionsFs['mkdir'] = async (path: string) => {
        entries.set(path, {
            name: path,
            path,
            type: 'directory',
        })
    }

    const mkdirSync: FilesystemOptionsFs['mkdirSync'] = (path: string) => {
        entries.set(path, {
            name: path,
            path,
            type: 'directory',
        })
    }

    const remove: FilesystemOptionsFs['remove'] = async (path: string) => {
        entries.delete(path)
    }

    const removeSync: FilesystemOptionsFs['removeSync'] = (path: string) => {
        entries.delete(path)
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
