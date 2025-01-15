interface DriveListOptions {
    onlyFiles?: boolean
    onlyDirs?: boolean
}

export interface Drive {
    list(path: string, options?: DriveListOptions): Promise<string[]>
    read: (path: string) => Promise<string>
    exists: (path: string) => Promise<boolean>
    write: (path: string, content: string) => Promise<void>
    mkdir: (path: string) => Promise<void>
    destroy: (path: string) => Promise<void>
}
