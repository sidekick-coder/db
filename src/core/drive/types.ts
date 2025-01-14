export interface Drive {
    list(path: string): Promise<string[]>
    read: (path: string) => Promise<string>
    write: (path: string, content: string) => Promise<void>
    destroy: (path: string) => Promise<void>
}
