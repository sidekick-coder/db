import { ListOptions } from '@/core/database/list.js'
import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { createEncryption } from './encryption.js'
import { count, query } from '@/core/provider/queryArray.js'
import { findMetadata } from './findMetadata.js'
import { Parser } from '@/core/parsers/all.js'
import { findPassword } from './findPassword.js'

interface Payload {
    filesystem: Filesystem
    root: string
    options?: ListOptions
    parser: Parser
}

export async function list(payload: Payload) {
    const { filesystem, root, options, parser } = payload

    const resolve = (...args: string[]) => filesystem.path.resolve(root, ...args)

    const password = findPassword({
        filesystem,
        root,
    })

    const encryption = createEncryption({
        password,
    })

    const where = options?.where || {}
    const exclude = options?.exclude || []
    const include = options?.include || []
    const limit = options?.limit
    const page = options?.page || 1

    const files = filesystem.readdirSync(root)
    const excludePatterns = ['.db']

    const result = [] as any[]

    for (const folder of files) {
        if (excludePatterns.includes(folder)) {
            continue
        }

        const metadata = findMetadata({
            filesystem,
            root,
            id: folder,
        })

        encryption.setSalt(metadata.salt).setIv(metadata.iv)

        const filename = filesystem.existsSync(resolve(folder, `index.${parser.ext}`))
            ? resolve(folder, `index.${parser.ext}`)
            : resolve(folder, encryption.encrypt(`index.${parser.ext}`))

        const basename = filesystem.path.basename(filename)

        if (!filesystem.existsSync(filename)) {
            const error = new Error(`Index file not found at ${filename}`)

            Object.assign(error, {
                folder: resolve(folder),
                filename: `index.${parser.ext}`,
                encrypted_filename: encryption.encrypt(`index.${parser.ext}`),
            })

            throw error
        }

        const fileMeta = metadata?.files?.find((f: any) => f.name === basename)

        let raw = filesystem.readSync(filename)

        if (fileMeta?.encrypted) {
            raw = encryption.decrypt(raw)
        }

        const rawText = new TextDecoder().decode(raw)

        const item = {
            id: folder.replace(`.${parser.ext}`, ''),
            folder: resolve(folder),
            raw: rawText,
            encrypted: fileMeta?.encrypted || false,
        }

        Object.assign(item, parser.parse(rawText))

        result.push(item)
    }

    const items = query(result, {
        where,
        exclude,
        include,
        limit,
        offset: page > 1 ? (page - 1) * limit : 0,
    })

    const meta = {
        total: count(result, { where }),
        limit,
        total_pages: limit ? Math.ceil(result.length / limit) : 1,
    }

    return {
        meta,
        data: items,
    }
}
