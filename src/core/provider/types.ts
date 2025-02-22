import { CreateOptions } from '../database/create.js'
import { DestroyOptions } from '../database/destroy.js'
import { FindOptions } from '../database/find.js'
import { UpdateOptions } from '../database/update.js'
import { Provider } from './schema.js'
import type { ListOptions } from '@/core/database/list.js'

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

export interface DataItem {
    [key: string]: any
}

export interface ListResponse {
    meta: any
    data: DataItem[]
}

export interface DataProvider {
    list?: (options: ListOptions) => Promise<ListResponse>
    find?: (options: FindOptions) => Promise<DataItem | null>
    create?: (options: CreateOptions) => Promise<DataItem>
    update?: (options: UpdateOptions) => Promise<{ count: number }>
    destroy?: (options: DestroyOptions) => Promise<{ count: number }>
}

export interface MountDataProvider {
    (config: any): DataProvider
}
