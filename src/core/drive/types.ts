interface DriveListOptions {
    onlyFiles?: boolean
    onlyDirs?: boolean
}

interface RecursiveOptions {
    recursive?: boolean
}

export interface Drive {
    list(path: string, options?: DriveListOptions): Promise<string[]>
    listSync(path: string, options?: DriveListOptions): string[]

    read: (path: string) => Promise<string>
    readSync: (path: string) => string

    exists: (path: string) => Promise<boolean>
    existsSync: (path: string) => boolean

    write: (path: string, content: string, options?: RecursiveOptions) => Promise<void>
    writeSync: (path: string, content: string, options?: RecursiveOptions) => void

    mkdir: (path: string, options?: RecursiveOptions) => Promise<void>
    mkdirSync: (path: string, options?: RecursiveOptions) => void

    destroy: (path: string) => Promise<void>
    destroySync: (path: string) => void
}
