export interface Where {
    [key: string]: any
}

export interface Sort {
    sortBy: string | string[]
    sortDesc?: boolean | boolean[]
}

export interface ListOptions {
    where?: Where
    sort?: Sort
}

export interface DataItem {
    [key: string]: any
}

export interface DataProvider {
    list: (options?: ListOptions) => Promise<DataItem[]>
}

export interface MountDataProvider {
    (config: any): DataProvider
}
