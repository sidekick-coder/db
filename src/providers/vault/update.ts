import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { createEncryption } from './encryption.js'
import { Parser } from '@/core/parsers/all.js'
import { UpdateOptions } from '@/core/database/update.js'
import { list } from './list.js'
import { findMetadata } from './findMetadata.js'
import { omit } from 'lodash-es'
import { findPassword } from './findPassword.js'

interface Payload {
    filesystem: Filesystem
    root: string
    options: UpdateOptions
    parser: Parser
}

export async function update(payload: Payload) {
    const { filesystem, root, options, parser } = payload
    const resolve = (...args: string[]) => filesystem.path.resolve(root, ...args)

    const password = findPassword({
        filesystem,
        root,
    })

    const encryption = createEncryption({
        password,
    })

    const data = options.data

    const { data: items } = await list({
        filesystem,
        root,
        parser,
        options: {
            where: options.where,
            limit: options.limit,
        },
    })

    const hideKeys = ['id', 'folder', 'raw', 'lock']

    for (const item of items) {
        const id = item.id

        const metadata = findMetadata({
            id,
            filesystem,
            root,
        })

        encryption.setSalt(metadata.salt).setIv(metadata.iv)

        const baseName = `index.${parser.ext}`
        const baseNameEncrypted = encryption.encrypt(baseName)

        const fileMeta = metadata.files.find(
            (f) => f.name === baseNameEncrypted || f.name === baseName
        )

        const filename = resolve(id, fileMeta.encrypted ? baseNameEncrypted : baseName)

        const properties = omit({ ...item, ...data }, hideKeys)

        let content = new TextEncoder().encode(parser.stringify(properties))

        if (fileMeta.encrypted) {
            content = encryption.encrypt(content)
        }

        filesystem.writeSync(filename, content)
    }

    return { count: items.length }
}
