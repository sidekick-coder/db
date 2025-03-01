import { tryCatch } from '@/utils/tryCatch.js'
import { YAML } from '@/core/parsers/yaml.js'
import type { FilesystemOptions } from './types.js'
import { createFsNode } from './createFsNode.js'
import { createPathNode } from './createPathNode.js'
import { validate, ValidatePayload, ValidateResult } from '../validator/validate.js'

export type Filesystem = ReturnType<typeof createFilesystem>

interface ReadOptions {
    recursive?: boolean
}

interface ReadJsonOptions extends ReadOptions {
    reviver?: (key: any, value: any) => any
    default?: Record<string, any>
    schema?: ValidatePayload
}

/*  eslint-disable prettier/prettier */
type ReadOutput<T extends ReadJsonOptions> =
    T extends { schema: ValidatePayload } ? ValidateResult<T['schema']> | null :
    Record<string, any> | null
/*  eslint-enable prettier/prettier */

export function createFilesystem(options: FilesystemOptions = {}) {
    const fs = options.fs || createFsNode()
    const path = options.path || createPathNode()

    const locks = new Set<string>()

    function awaitLock(filepath: string, timeout = 1000) {
        return new Promise<void>((resolve, reject) => {
            const interval = setInterval(() => {
                if (!locks.has(filepath)) {
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

    async function read(filepath: string) {
        return fs.read(filepath)
    }

    read.text = async function (filepath: string, options?: any) {
        const content = await read(filepath)

        if (!content) {
            return options?.default || ''
        }

        return new TextDecoder().decode(content)
    }

    read.json = async function <T extends ReadJsonOptions>(
        filepath: string,
        options?: T
    ): Promise<ReadOutput<T>> {
        const content = await read.text(filepath)

        if (!content) {
            return (options?.default || null) as any
        }

        const [json, error] = await tryCatch(() => JSON.parse(content, options?.reviver))

        if (options?.schema) {
            return validate(options.schema, json) as any
        }

        return error ? options?.default || null : json
    }

    read.yaml = async function (filepath: string, options?: any) {
        const content = await read.text(filepath)

        if (!content) {
            return options?.default || null
        }

        const [yml, error] = await tryCatch(() => YAML.parse(content, options?.reviver))

        return error ? options?.default || null : yml
    }

    function readSync(filepath: string) {
        return fs.readSync(filepath)
    }

    readSync.text = function (filepath: string, defaultValue: string = '') {
        const content = readSync(filepath)

        if (!content) {
            return defaultValue
        }

        return new TextDecoder().decode(content)
    }

    readSync.json = function <T extends ReadJsonOptions>(
        filepath: string,
        options?: T
    ): ReadOutput<T> {
        const content = readSync.text(filepath)

        if (!content) {
            return (options?.default || null) as any
        }

        const [json, error] = tryCatch.sync(() => JSON.parse(content, options?.reviver))

        if (options?.schema) {
            return validate(options.schema, json) as any
        }

        return error ? options?.default || null : json
    }

    readSync.yaml = function (filepath: string, options?: any) {
        const content = readSync.text(filepath)

        if (!content) {
            return options?.default || null
        }

        const [yml, error] = tryCatch.sync(() => YAML.parse(content, options?.parseOptions))

        return error ? options?.default || null : yml
    }

    async function readdir(filepath: string) {
        return fs.readdir(filepath)
    }

    function readdirSync(filepath: string) {
        return fs.readdirSync(filepath)
    }

    async function mkdir(filepath: string, options?: any) {
        if (await fs.exists(filepath)) return

        if (options?.recursive) {
            const parent = path.dirname(filepath)

            await mkdir(parent, options)
        }

        await fs.mkdir(filepath)
    }

    function mkdirSync(filepath: string, options?: any) {
        if (fs.existsSync(filepath)) return

        if (options?.recursive) {
            const parent = path.dirname(filepath)

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
            const parent = path.dirname(filename)

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
            const parent = path.dirname(filename)

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

    function remove(filepath: string) {
        return fs.remove(filepath)
    }

    function removeSync(filepath: string) {
        return fs.removeSync(filepath)
    }
    function removeAt(filepath: string, miliseconds: number) {
        return fs.removeAt(filepath, miliseconds)
    }

    return {
        path,
        fs,

        exists: fs.exists,
        existsSync: fs.existsSync,

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
        removeAt,
    }
}
