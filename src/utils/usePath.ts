import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

export const usePath = (url: string) => {
    const __filename = fileURLToPath(url)
    const __dirname = dirname(__filename)

    return { __filename, __dirname }
}

export function rootPath(...paths: string[]) {
    const { __dirname } = usePath(import.meta.url)

    return resolve(__dirname, '..', ...paths)
}
