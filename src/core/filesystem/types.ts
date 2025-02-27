export interface FilesystemOptionsFs {
    exists: (path: string) => Promise<boolean>
    existsSync: (path: string) => boolean

    read: (path: string) => Promise<Uint8Array | null>
    readSync: (path: string) => Uint8Array | null

    readdir: (path: string) => Promise<string[]>
    readdirSync: (path: string) => string[]

    write: (path: string, content: Uint8Array) => Promise<void>
    writeSync: (path: string, content: Uint8Array) => void

    mkdir: (path: string) => Promise<void>
    mkdirSync: (path: string) => void
}

export interface FilesystemOptions {
    fs?: FilesystemOptionsFs
}
