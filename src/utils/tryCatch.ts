type TryCatchPromiseResult<T extends Function> = [Awaited<ReturnType<T>>, null] | [null, Error]

export async function tryCatch<T extends Function>(tryer: T): Promise<TryCatchPromiseResult<T>> {
    try {
        const result = await tryer()
        return [result, null]
    } catch (error) {
        return [null, error]
    }
}

tryCatch.sync = function <T extends Function>(tryer: T): TryCatchPromiseResult<T> {
    try {
        const result = tryer()
        return [result, null]
    } catch (error) {
        return [null, error]
    }
}
