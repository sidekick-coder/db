import path from 'path'
import { Config } from './config.js'
import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { Encryption } from './encryption.js'
import { CreateOptions } from '@/core/database/create.js'
import { lock } from './lock.js'
import { find } from './find.js'
import { Parser } from '@/core/parsers/all.js'

interface Options {
    filesystem: Filesystem
    createOptions: CreateOptions
    providerConfig: Config
    encryption: Encryption
    makeId: () => Promise<string>
    parser: Parser
}

export async function create(options: Options) {
    const { filesystem, encryption, createOptions, providerConfig, makeId, parser } = options

    const data = createOptions.data

    const id = data.id || (await makeId())

    if (filesystem.existsSync(path.resolve(providerConfig.path, id))) {
        throw new Error(`Item with id "${id}" already exists`)
    }

    const filename = path.resolve(providerConfig.path, id, `index.${parser.ext}`)

    filesystem.mkdirSync(path.resolve(providerConfig.path, id))

    filesystem.writeSync.text(filename, parser.stringify(data))

    await lock({
        id,
        encryption,
        filesystem,
        providerConfig,
    })

    const item = await find({
        filesystem,
        findOptions: { where: { id: String(id) }, limit: 1 },
        providerConfig,
        encryption,
        parser,
    })

    return item!
}
