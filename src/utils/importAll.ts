import { promises as fs } from 'fs'
import { resolve } from 'path'
import { pathToFileURL } from 'url'

export async function importAll(path: string, options: any) {
    const files = await fs.readdir(path)

    const result = {}

    for await (const file of files) {

        if (options?.exclude && options.exclude.includes(file)) {
            continue
        }

        const url = pathToFileURL(resolve(path, file))
        const module = await import(url.href)

        result[file] = module
    }

    return result
}
