import { promises as fs } from 'fs'

export async function list(path: string): Promise<string[]> {
    return fs.readdir(path)
}
