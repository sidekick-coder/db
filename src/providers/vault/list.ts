import path from 'path'
import { ListOptions } from '@/core/database/list.js'
import { Config } from './config.js'
import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { Encryption } from './encryption.js'
import { count, query } from '@/core/provider/queryArray.js'
import { findMetadata } from './findMetadata.js'

interface Options {
    filesystem: Filesystem
    listOptions: ListOptions
    providerConfig: Config
    encryption: Encryption
    parser: {
        ext: string
        parse: (raw: string) => Record<string, any>
    }
}

export async function list(options: Options) {
    const { filesystem, encryption, listOptions, providerConfig, parser } = options

    const where = listOptions?.where || {}
    const exclude = listOptions?.exclude || []
    const include = listOptions?.include || []
    const limit = listOptions?.limit
    const page = listOptions?.page || 1

    const files = filesystem.readdirSync(providerConfig.path)
    const excludePatterns = ['.db']

    const result = [] as any[]

    for (const folder of files) {
        if (excludePatterns.includes(folder)) {
            continue
        }

        const metadata = findMetadata({
            filesystem,
            providerConfig,
            id: folder,
        })

        encryption.setSalt(metadata.salt).setIv(metadata.iv)

        const filename = filesystem.existsSync(
            path.resolve(providerConfig.path, folder, `index.${parser.ext}`)
        )
            ? path.resolve(providerConfig.path, folder, `index.${parser.ext}`)
            : path.resolve(providerConfig.path, folder, encryption.encrypt(`index.${parser.ext}`))

        const basename = path.basename(filename)

        if (!filesystem.existsSync(filename)) {
            const error = new Error('Index file not found')

            Object.assign(error, {
                folder: path.resolve(providerConfig.path, folder),
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
            folder: path.resolve(providerConfig.path, folder),
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
