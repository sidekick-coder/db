import fs from 'fs'
import * as YAML from './yaml.js'

export function readFile(path: string) {
    return fs.readFileSync(path, 'utf-8')
}

readFile.async = async function (path: string) {
    return fs.promises.readFile(path, 'utf-8')
}

export function readJson<T = any>(path: string, options?: any): T {
    const content = readFile(path)

    return JSON.parse(content, options?.reviver) as T
}

export function readYaml<T = any>(path: string, options?: any): T {
    const content = readFile(path)

    return YAML.parse(content, options?.reviver) as T
}
