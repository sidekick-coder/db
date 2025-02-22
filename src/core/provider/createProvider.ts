import { provider } from '@/providers/file/index.js'

const providers = [
    {
        name: 'file',
        provider: provider,
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
