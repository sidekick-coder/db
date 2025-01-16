import { Drive } from '@/core/drive/types.js'
import { createFileProvider } from '../file/provider.js'
import { YAML } from '@/core/parsers/index.js'

interface YamlProviderConfig {
    ext: 'yaml' | 'yml'
    drive: Drive
}

export function createYamlProvider({ drive, ext }: YamlProviderConfig) {
    return createFileProvider({
        drive,
        ext,
        parse: YAML.parse,
        stringify: (contents) => YAML.stringify(contents, null, 4),
    })
}
