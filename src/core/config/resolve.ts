import { drive } from '@/core/drive/index.js'
import { YAML } from '@/core/parsers/index.js'
import { v, validate } from '../validator/index.js'
import { database, config } from './schemas.js'
import { dirname } from 'path'
import { SourceItemFile } from '../common/sources.js'

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

    return validate(schema, yml)
}
