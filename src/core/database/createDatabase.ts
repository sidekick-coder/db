import { list as baseList, type ListOptions } from './list.js'
import { find as baseFind, FindOptions } from './find.js'
import { create as baseCreate, type CreateOptions } from './create.js'
import { update as baseUpdate, type UpdateOptions } from './update.js'
import { destroy as baseDestroy, type DestroyOptions } from './destroy.js'
import { DatabaseDefinition } from '../config/schemas.js'
import { createProvider } from '../provider/createProvider.js'

interface Options {
    root: string
}

export interface Database extends ReturnType<typeof createDatabase> {}

export function createDatabase(definition: DatabaseDefinition, options: Options) {
    const instance = createProvider({
        name: definition.provider.name,
        config: definition.provider.config,
        root: options.root,
    })

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
        provider: instance,
        definition,
        name: definition.name,
        list,
        find,
        create,
        update,
        destroy,
        method,
    }
}
