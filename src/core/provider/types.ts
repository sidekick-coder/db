export interface WhereCondition {
    field: string
    operator?: string
    value: any
}

export interface WhereGroup {
    or?: WhereCondition[]
    and?: WhereCondition[]
}

export interface WhereMain {
    [key: string]: Omit<WhereCondition, 'field'> | any
}

export type Where = WhereMain & WhereGroup

export interface Field {
    exclude?: string[]
    include?: string[]
}

export interface Sort {
    sortBy: string | string[]
    sortDesc?: boolean | boolean[]
}

export interface ListOptions {
    where?: Where
    sort?: Sort
    exclude?: string[]
    include?: string[]
}

export interface DataItem {
    [key: string]: any
}

export interface DataProvider {
    list: (options?: ListOptions) => Promise<DataItem[]>
    create: (data: any) => Promise<DataItem>
    update: (data: any, where?: Where) => Promise<{ count: number }>
    destroy: (where?: Where) => Promise<{ count: number }>
}

export interface MountDataProvider {
    (config: any): DataProvider
}
