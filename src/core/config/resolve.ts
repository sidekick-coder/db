import { drive } from '@/core/drive/index.js'
import { YAML } from '@/core/parsers/index.js'
import { v, validate } from '../validator/index.js'
import { database, config, DatabaseDefinition } from './schemas.js'
import { dirname } from 'path'
import { SourceItem, SourceItemFile } from '../common/sources.js'

export interface Config {
    dirname: string
    filename: string
    databases: {
        default: string
        sources: SourceItem<DatabaseDefinition>[]
    }
    [key: string]: any
}

export function resolve(filename: string) {
    const root = dirname(filename)

    const schema = v.pipe(
        v.union([config(root), database(root)]),
        v.transform((value) => {
            if ('databases' in value) {
                return value
            }

            const item: SourceItemFile = {
                filename: filename,
                dirname: dirname(filename),
                data: value,
            }

            return {
                databases: {
                    default: value.name,
                    sources: [item],
                },
            }
        })
    )

    const text = drive.readSync(filename)

    const yml = YAML.parse(text)

    const result = validate(schema, yml)

    return {
        dirname: root,
        filename,
        ...result,
    } as Config
}
