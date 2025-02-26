import { tryCatch } from '@/utils/tryCatch.js'
import { YAML } from '@/core/parsers/yaml.js'
import type { FilesystemOptionsFs } from './types.js'
import { createDefaultFs } from './createDefaultFs.js'
import { dirname } from 'path'

export interface FilesystemOptions {
    fs?: FilesystemOptionsFs
}

export function createFilesystem(options: FilesystemOptions = {}) {
    const fs = options.fs || createDefaultFs()

    const locks = new Set<string>()

    function awaitLock(path: string, timeout = 1000) {
        return new Promise<void>((resolve, reject) => {
            const interval = setInterval(() => {
                if (!locks.has(path)) {
                    clearInterval(interval)
                    resolve()
                }
            }, 100)

            setTimeout(() => {
                clearInterval(interval)
                reject(new Error('Timeout'))
            }, timeout)
        })
    }

    async function read(path: string) {
        return fs.read(path)
    }

    read.text = async function (filepath: string, options?: any) {
        const content = await read(filepath)

        if (!content) {
            return options?.default || ''
        }

        return new TextDecoder().decode(content)
    }

    read.json = async function (path: string, options?: any) {
        const content = await read.text(path)

        if (!content) {
            return options?.default || null
        }

        const [json, error] = await tryCatch(() => JSON.parse(content, options?.reviver))

        return error ? options?.default || null : json
    }

    read.yaml = async function (path: string, options?: any) {
        const content = await read.text(path)

        if (!content) {
            return options?.default || null
        }

        const [yml, error] = await tryCatch(() => YAML.parse(content, options?.reviver))

        return error ? options?.default || null : yml
    }

    function readSync(path: string) {
        return fs.readSync(path)
    }

    readSync.text = function (filepath: string, defaultValue: string = '') {
        const content = readSync(filepath)

        if (!content) {
            return defaultValue
        }

        return new TextDecoder().decode(content)
    }

    readSync.json = function (path: string, options?: any) {
        const content = readSync.text(path)

        if (!content) {
            return options?.default || null
        }

        const [json, error] = tryCatch.sync(() => JSON.parse(content, options?.reviver))

        return error ? options?.default || null : json
    }

    readSync.yaml = function (path: string, options?: any) {
        const content = readSync.text(path)

        if (!content) {
            return options?.default || null
        }

        const [yml, error] = tryCatch.sync(() => YAML.parse(content, options?.parseOptions))

        return error ? options?.default || null : yml
    }

    async function readdir(path: string) {
        return fs.readdir(path)
    }

    function readdirSync(path: string) {
        return fs.readdirSync(path)
    }

    async function mkdir(filepath: string, options?: any) {
        if (await fs.exists(filepath)) return

        if (options?.recursive) {
            const parent = dirname(filepath)

            await mkdir(parent, options)
        }

        await fs.mkdir(filepath)
    }

    function mkdirSync(filepath: string, options?: any) {
        if (fs.existsSync(filepath)) return

        if (options?.recursive) {
            const parent = dirname(filepath)

            mkdirSync(parent, options)
        }

        fs.mkdirSync(filepath)
    }

    async function write(filename: string, content: Uint8Array, options?: any) {
        if (locks.has(filename)) {
            await awaitLock(filename)
        }

        locks.add(filename)

        if (options?.recursive) {
            const parent = dirname(filename)

            await mkdir(parent, { recursive: true })
        }

        const [, error] = await tryCatch(() => fs.write(filename, content))

        locks.delete(filename)

        if (error) {
            throw error
        }
    }

    write.text = async function (filename: string, content: string, options?: any) {
        await write(filename, new TextEncoder().encode(content), options)
    }

    write.json = async function (filename: string, content: any, options?: any) {
        await write.text(filename, JSON.stringify(content, null, 2), options)
    }

    function writeSync(filename: string, content: Uint8Array, options?: any) {
        if (options?.recursive) {
            const parent = dirname(filename)

            mkdirSync(parent, { recursive: true })
        }

        fs.writeSync(filename, content)
    }

    writeSync.text = function (filename: string, content: string, options?: any) {
        writeSync(filename, new TextEncoder().encode(content), options)
    }

    writeSync.json = function (filename: string, content: any, options?: any) {
        writeSync.text(filename, JSON.stringify(content, null, 2), options)
    }

    function remove(path: string) {
        return fs.remove(path)
    }

    function removeSync(path: string) {
        return fs.removeSync(path)
    }

    return {
        exists: fs.exists,
        existsSync: fs.existsSync,
        read,
        readSync,
        readdir,
        readdirSync,
        write,
        writeSync,
        mkdir,
        remove,
        removeSync,
    }
}
