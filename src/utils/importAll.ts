import { promises as fs } from 'fs'
import { resolve } from 'path'

export async function importAll(path: string) {
    const files = await fs.readdir(path)

    const result = {}

    for await (const file of files) {
        const module = await import(resolve(path, file))

        result[file] = module
    }

    return result
}
