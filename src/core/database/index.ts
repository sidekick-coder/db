import { MountDataProvider } from '../provider/types.js'

import { list as baseList, type ListOptions } from '@/core/api/list.js'
import { find as baseFind, FindOptions } from '@/core/api/find.js'
import { create as baseCreate, type CreateOptions } from '@/core/api/create.js'
import { update as baseUpdate, type UpdateOptions } from '@/core/api/update.js'
import { destroy as baseDestroy, type DestroyOptions } from '@/core/api/destroy.js'

interface Options {
    name: string
    provider: MountDataProvider
    config?: any
}

type BaseOptions<T> = Omit<T, 'provider'>

export function createDatabase(options: Options) {
    const instance = options.provider(options.config)

    function list(payload?: BaseOptions<ListOptions>) {
        const options = baseOptions(payload)

        return baseList(options)
    }

    function find(payload: BaseOptions<FindOptions>) {
        const options = baseOptions(payload)

        return baseFind(options)
    }

    function create(payload: BaseOptions<CreateOptions>) {
        const options = baseOptions(payload)

        return baseCreate(options)
    }

    function update(payload: BaseOptions<UpdateOptions>) {
        const options = baseOptions(payload)

        return baseUpdate(options)
    }

    function destroy(payload: BaseOptions<DestroyOptions>) {
        const options = baseOptions(payload)

        return baseDestroy(options)
    }

    function method(name: string, ...args: any[]) {
        if (!instance[name]) {
            throw new Error(`Method ${name} does not exist`)
        }

        return instance[name](...args)
    }

    function baseOptions(payload: any) {
        return {
            provider: instance,
            ...payload,
        }
    }

    return {
        name: options.name,
        config: options.config,
        provider: options.provider,
        list,
        find,
        create,
        update,
        destroy,
        method,
    }
}
