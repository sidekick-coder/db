import fs from 'fs'
import path from 'path'
import { tryCatch } from './tryCatch.js'
import { fileURLToPath } from 'url'
import { YAML } from '@/core/parsers/yaml.js'

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

export async function fileExists(path: string) {
    const [, error] = await tryCatch(() => fs.promises.access(path))

    return error ? false : true
}

export async function readFile(path: string) {
    const [content, error] = await tryCatch(() => fs.promises.readFile(path))

    if (error) {
        return null
    }

    return new Uint8Array(content)
}

readFile.text = async function (filepath: string, defaultValue: string = '') {
    const content = await readFile(filepath)

    if (!content) {
        return defaultValue
    }

    return new TextDecoder().decode(content)
}

readFile.json = async function (path: string, options?: any) {
    const content = await readFile.text(path)

    if (!content) {
        return options?.default || null
    }

    const [json, error] = await tryCatch(() => JSON.parse(content, options?.reviver))

    return error ? options?.default || null : json
}

readFile.yaml = async function (path: string, options?: any) {
    const content = await readFile.text(path)

    if (!content) {
        return options?.default || null
    }

    const [yml, error] = await tryCatch(() => YAML.parse(content, options?.reviver))

    return error ? options?.default || null : yml
}

export function readFileSync(path: string) {
    const [content, error] = tryCatch.sync(() => fs.readFileSync(path))

    if (error) {
        return null
    }

    return new Uint8Array(content)
}

readFileSync.text = function (filepath: string, defaultValue: string = '') {
    const content = readFileSync(filepath)

    if (!content) {
        return defaultValue
    }

    return new TextDecoder().decode(content)
}

readFileSync.json = function (path: string, options: any) {
    const content = readFileSync.text(path)

    if (!content) {
        return options?.default || null
    }

    const [json, error] = tryCatch.sync(() => JSON.parse(content, options?.reviver))

    return error ? options?.default || null : json
}

readFileSync.yaml = function (path: string, options?: any) {
    const content = readFileSync.text(path)

    if (!content) {
        return options?.default || null
    }

    const [yml, error] = tryCatch.sync(() => YAML.parse(content, options?.parseOptions))

    return error ? options?.default || null : yml
}

export async function readDir(path: string, options?: any) {
    const [files, error] = await tryCatch(() =>
        fs.promises.readdir(path, {
            withFileTypes: true,
        })
    )

    if (error) {
        return []
    }

    let result = files

    if (options?.onlyFiles) {
        result = files.filter((file) => file.isFile())
    }

    if (options?.onlyDirectories) {
        result = files.filter((file) => file.isDirectory())
    }

    return result.map((file) => file.name)
}

export function readDirSync(path: string, options?: any) {
    const [files, error] = tryCatch.sync(() =>
        fs.readdirSync(path, {
            withFileTypes: true,
        })
    )

    if (error) {
        return []
    }

    let result = files

    if (options?.onlyFiles) {
        result = files.filter((file) => file.isFile())
    }

    if (options?.onlyDirectories) {
        result = files.filter((file) => file.isDirectory())
    }

    return result.map((file) => file.name)
}

export function copy(source: string, destination: string, options?: any) {
    return fs.promises.cp(source, destination, options)
}

export async function mkdir(filepath: string, options?: any) {
    if (await fileExists(filepath)) return

    if (options?.recursive) {
        const parent = path.dirname(filepath)

        await mkdir(parent, options)
    }

    await fs.promises.mkdir(filepath, options)
}

export async function writeFile(filename: string, content: Uint8Array, options?: any) {
    if (locks.has(filename)) {
        await awaitLock(filename)
    }

    locks.add(filename)

    if (options?.recursive) {
        const parent = path.dirname(filename)

        await mkdir(parent, { recursive: true })
    }

    const [, error] = await tryCatch(() => fs.promises.writeFile(filename, content))

    locks.delete(filename)

    if (error) {
        throw error
    }
}

writeFile.text = async function (filename: string, content: string, options?: any) {
    await writeFile(filename, new TextEncoder().encode(content), options)
}

writeFile.json = async function (filename: string, content: any, options?: any) {
    await writeFile.text(filename, JSON.stringify(content, null, 2), options)
}

export function writeFileSync(filename: string, content: Uint8Array, options?: any) {
    if (options?.recursive) {
        const parent = path.dirname(filename)

        fs.mkdirSync(parent, { recursive: true })
    }

    fs.writeFileSync(filename, content)
}

writeFileSync.text = function (filename: string, content: string, options?: any) {
    writeFileSync(filename, new TextEncoder().encode(content), options)
}

writeFileSync.json = function (filename: string, content: any, options?: any) {
    writeFileSync.text(filename, JSON.stringify(content, null, 2), options)
}

export function resolve(url: string, ...args: string[]) {
    const __dirname = path.dirname(fileURLToPath(url))

    return path.resolve(__dirname, ...args)
}

export function removeFile(path: string) {
    return fs.promises.rm(path)
}

export function removeFileSync(path: string) {
    return fs.rmSync(path)
}

export const filesystem = {
    path,
    resolve,
    exists: fileExists,
    read: readFile,
    readSync: readFileSync,
    readdir: readDir,
    readdirSync: readDirSync,
    copy: copy,
    write: writeFile,
    writeSync: writeFileSync,
    mkdir: mkdir,
    remove: removeFile,
    removeSync: removeFileSync,
}
