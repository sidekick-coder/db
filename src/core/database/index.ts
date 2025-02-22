import { MountDataProvider } from '../provider/types.js'

import { list as baseList, type ListOptions } from './list.js'
import { find as baseFind, FindOptions } from './find.js'
import { create as baseCreate, type CreateOptions } from './create.js'
import { update as baseUpdate, type UpdateOptions } from './update.js'
import { destroy as baseDestroy, type DestroyOptions } from './destroy.js'

interface Options {
    name: string
    provider: MountDataProvider
    config?: any
}

export function createDatabase(options: Options) {
    const instance = options.provider(options.config)

    function list(payload: ListOptions) {
        return baseList(instance, payload)
    }

    function find(payload: FindOptions) {
        return baseFind(instance, payload)
    }

    function create(payload: CreateOptions) {
        return baseCreate(instance, payload)
    }

    function update(payload: UpdateOptions) {
        return baseUpdate(instance, payload)
    }

    function destroy(payload: DestroyOptions) {
        return baseDestroy(instance, payload)
    }

    function method(name: string, ...args: any[]) {
        if (!instance[name]) {
            throw new Error(`Method ${name} does not exist`)
        }

        return instance[name](...args)
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
