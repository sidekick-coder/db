import { ProviderSchema } from './schema.js'

export interface WhereCondition {
    field: string
    operator?: string
    value: any
}

export interface WhereGroup {
    or?: WhereCondition[]
    and?: WhereCondition[]
}

export interface Where {
    [key: string]: any
    and?: Where[]
    or?: Where[]
}

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
    pagination?: any
    exclude?: string[]
    include?: string[]
}

export interface DataItem {
    [key: string]: any
}

export interface ListResponse {
    meta: any
    data: DataItem[]
}

export interface DataProvider {
    list?: (options?: ListOptions) => Promise<ListResponse>
    find?: (where?: Where, field?: Field) => Promise<DataItem | null>
    create?: (data: any) => Promise<DataItem>
    update?: (data: any, where?: Where) => Promise<{ count: number }>
    destroy?: (where?: Where) => Promise<{ count: number }>
}

export interface MountDataProvider {
    (config: any): ProviderSchema
}
