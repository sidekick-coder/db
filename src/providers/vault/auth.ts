import { Filesystem } from '@/core/filesystem/createFilesystem.js'
import { createEncryption } from './encryption.js'
import { v } from '@/core/validator/valibot.js'
import { validate } from '@/core/validator/validate.js'
import ms from 'ms'

interface Payload {
    filesystem: Filesystem
    root: string
    options: {
        password: string
    }
}

export async function auth(payload: Payload) {
    const { filesystem, root } = payload
    const resolve = filesystem.path.resolve

    const metaFilename = resolve(root, '.db', 'password.json')

    if (!(await filesystem.exists(metaFilename))) {
        throw new Error(
            `Password metadata file not found in ${metaFilename}\n Please run "db init" command first`
        )
    }

    const schema = v.objectAsync({
        password: v.prompts.password(),
        timeout: v.optional(v.string(), '1hs'),
    })

    const options = await validate.async(schema, payload.options)

    const metadata = await filesystem.read.json(metaFilename, {
        schema: (v) =>
            v.object({
                salt: v.string(),
                iv: v.string(),
                test: v.string(),
            }),
    })

    const encryption = createEncryption({
        password: options.password,
        salt: metadata.salt,
        iv: metadata.iv,
    })

    if (!encryption.decrypt(metadata.test).includes('success')) {
        throw new Error(`Invalid password`)
    }

    const filename = resolve(root, '.db', 'password')

    filesystem.writeSync.text(filename, options.password)

    const milisseconds = ms(options.timeout as ms.StringValue)

    const scheduleDeletion = await filesystem.removeAt(filename, milisseconds)

    if (!scheduleDeletion) {
        console.log(
            `Can't schedule deletion of password file, please remove it manually when you finish`
        )
    }

    return {
        message: `Authenticated successfully`,
        filename,
        timeout: options.timeout,
    }
}
