import * as file from '@/providers/file/index.js'
import * as folder from '@/providers/folder/index.js'
import * as notion from '@/providers/notion/index.js'
import * as vault from '@/providers/vault/index.js'

const providers = [
    {
        name: 'file',
        provider: file.provider,
    },
    {
        name: 'folder',
        provider: folder.provider,
    },
    {
        name: 'notion',
        provider: notion.provider,
    },
    {
        name: 'vault',
        provider: vault.provider,
    },
]

interface Options {
    name: string
    config: any
    root: string
}

export function createProvider(options: Options) {
    const { name, config, root } = options

    const provider = providers.find((p) => p.name === name)

    if (!provider) {
        throw new Error(`Provider "${name}" not found`)
    }

    return provider.provider(config, {
        root,
    })
}
