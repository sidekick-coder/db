import crypto from 'crypto'
import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { pad } from '@/core/idStrategy/createIncremental.js'
import { Parser } from '@/core/parsers/all.js'
import { createEncryption } from '../encryption.js'

interface Options {
    root: string
    filesystem: Filesystem
    parser: Parser
}

export function createFactories(options: Options) {
    const { filesystem, parser, root } = options
    const resolve = filesystem.path.resolve

    function makeEncryption() {
        const encryption = createEncryption()

        const password = crypto.randomBytes(16).toString('hex')
        const salt = crypto.randomBytes(16).toString('hex')
        const iv = crypto.randomBytes(16).toString('hex')

        encryption.setPassword(password).setSalt(salt).setIv(iv)

        filesystem.writeSync.text(resolve(root, '.db', 'password'), password, {
            recursive: true,
        })

        filesystem.writeSync.json(resolve(root, '.db', 'password.json'), {
            salt,
            iv,
            test: encryption.encrypt('success'),
        })

        return encryption
    }

    function makeItem(payload = {}) {
        const id = pad(filesystem.readdirSync(root).length + 1, 2)
        const folder = filesystem.path.resolve(root, id)
        const filename = filesystem.path.resolve(root, id, `index.${parser.ext}`)
        const raw = parser.stringify(payload)

        filesystem.writeSync.text(filename, raw, {
            recursive: true,
        })

        return {
            id,
            folder,
            raw,
            lock: false,
            ...parser.parse(raw),
        }
    }

    function makeManyItems(count = 5, payload?: any) {
        const items = []

        for (let i = 0; i < count; i++) {
            items.push(makeItem(payload))
        }

        return items
    }

    return {
        makeItem,
        makeManyItems,
        makeEncryption,
    }
}
