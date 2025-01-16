export interface Strategy {
    name: string
    create(config: any): Promise<string | number>
}
