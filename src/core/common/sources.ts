import { dirname, resolve } from 'path'
import { drive } from '../drive/index.js'
import { YAML } from '../parsers/yaml.js'
import { v } from '../validator/index.js'
import fg from 'fast-glob'

export interface SourceItemFile<T = any> {
    filename: string
    dirname: string
    data: T
}

export interface SourceItemData<T = any> {
    data: T
}

export type SourceItem<T = any> = SourceItemFile<T> | SourceItemData<T>

export const definition = (root: string) =>
    v.object({
        dirs: v.optional(v.extras.array(v.extras.path(root)), []),
        files: v.optional(v.extras.array(v.extras.path(root)), []),
        patterns: v.optional(v.extras.array(v.extras.path(root)), []),
        items: v.optional(v.array(v.any()), []),
    })

export const schema = (root: string) =>
    v.pipe(
        definition(root),
        v.transform((value) => {
            const items = [] as SourceItem[]
            const files: string[] = []

            for (const item of value.items || []) {
                items.push({
                    data: item,
                })
            }

            for (const file of value.files || []) {
                files.push(resolve(root, file))
            }

            for (const dir of value.dirs || []) {
                const entries = drive.listSync(dir)

                entries.forEach((entry) => {
                    files.push(resolve(dir, entry))
                })
            }

            for (const pattern of value.patterns || []) {
                const path = fg.convertPathToPattern(pattern)

                const entries = fg.sync(path)

                entries.forEach((entry) => {
                    files.push(resolve(entry))
                })
            }

            // remove duplicates
            const unique = files.filter((value, index, self) => self.indexOf(value) === index)

            for (const file of unique) {
                const content = drive.readSync(file)

                const view = YAML.parse(content)

                items.push({
                    filename: file,
                    dirname: dirname(file),
                    data: view,
                })
            }

            return items
        })
    )
