interface DriveListOptions {
    onlyFiles?: boolean
    onlyDirs?: boolean
}

interface RecursiveOptions {
    recursive?: boolean
}

export interface Drive {
    list(path: string, options?: DriveListOptions): Promise<string[]>
    read: (path: string) => Promise<string>
    exists: (path: string) => Promise<boolean>
    write: (path: string, content: string, options?: RecursiveOptions) => Promise<void>
    mkdir: (path: string, options?: RecursiveOptions) => Promise<void>
    destroy: (path: string) => Promise<void>
}
