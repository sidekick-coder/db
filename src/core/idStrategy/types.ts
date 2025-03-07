export interface Strategy {
    name: string
    create(options?: any): Promise<string>
}
