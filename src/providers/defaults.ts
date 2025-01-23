import { drive } from '@/core/drive/index.js'
import { createFolderProvider } from '@/providers/folder/index.js'
import { createJsonProvider, createMarkdownProvider } from '@/providers/file/index.js'
import { createYamlProvider } from '@/providers/file/yaml.js'
import { createNotionProvider } from '@/providers/notion/index.js'

export const all = [
    {
        name: 'folder',
        provider: createFolderProvider(drive),
    },
    {
        name: 'json',
        provider: createJsonProvider(drive),
    },
    {
        name: 'yaml',
        provider: createYamlProvider({ drive, ext: 'yaml' }),
    },
    {
        name: 'yml',
        provider: createYamlProvider({ drive, ext: 'yml' }),
    },
    {
        name: 'md',
        provider: createMarkdownProvider(drive),
    },
    {
        name: 'markdown',
        provider: createMarkdownProvider(drive),
    },
    {
        name: 'notion',
        provider: createNotionProvider(),
    },
]
