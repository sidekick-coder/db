import { Filesystem } from '../filesystem/createFilesystem.js'
import { validate } from '../validator/validate.js'
import { Strategy } from './types.js'

export function pad(value: number, size: number) {
    return value.toString().padStart(size, '0')
    return `${'0'.repeat(size - 1)}${value}`.slice(-size)
}

export function createIncremental(filesystem: Filesystem, filename: string): Strategy {
    async function create(payload: any = {}) {
        const options = validate(
            (v) =>
                v.object({
                    padding: v.optional(v.number(), 2),
                }),
            payload
        )

        if (!filesystem.existsSync(filename)) {
            filesystem.writeSync.json(filename, { last_id: 0 }, { recursive: true })
        }

        const content = filesystem.readSync.json(filename, {
            schema: (v) =>
                v.object({
                    last_id: v.number(),
                }),
        })

        const id = content.last_id + 1

        filesystem.writeSync.json(filename, { last_id: id })

        return pad(id, options.padding)
    }

    return {
        name: 'incremental',
        create,
    }
}
