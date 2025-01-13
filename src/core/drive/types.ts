export interface Drive {
    list(path: string): Promise<string[]>
    read: (path: string) => Promise<string>
}
