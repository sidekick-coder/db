import { promises as fs } from 'fs'

export async function readFile(path: string): Promise<string> {
    return fs.readFile(path, 'utf-8')
}
