import { promises as fs } from 'fs'

export async function read(path: string): Promise<string> {
    return fs.readFile(path, 'utf-8')
}
