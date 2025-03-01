interface Tryer {
    (...args: any[]): any
}

interface TryerAsync {
    (...args: any[]): Promise<any>
}

type TryCatchResult<T extends Tryer> = [ReturnType<T>, null] | [null, Error]

type TryCatchAsyncResult<T extends TryerAsync> = [Awaited<ReturnType<T>>, null] | [null, Error]

export async function tryCatch<T extends TryerAsync>(tryer: T): Promise<TryCatchAsyncResult<T>> {
    try {
        const result = await tryer()
        return [result, null]
    } catch (error) {
        return [null, error]
    }
}

tryCatch.sync = function <T extends Tryer>(tryer: T): TryCatchResult<T> {
    try {
        const result = tryer()
        return [result, null]
    } catch (error) {
        return [null, error]
    }
}
