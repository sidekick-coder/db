import { v } from '@/core/validator/valibot.js'
import { InferOutput } from 'valibot'
import crypto from 'crypto'
import { validate } from '@/core/validator/validate.js'

export type Encryption = ReturnType<typeof createEncryption>

const schema = v.object({
    value: v.union([v.string(), v.extras.uint8()]),
    salt: v.optional(v.string(), crypto.randomBytes(16).toString('hex')),
    iv: v.optional(v.string(), crypto.randomBytes(16).toString('hex')),
    password: v.string(),
})

export interface EncryptPayload extends InferOutput<typeof schema> {}

/* eslint-disable prettier/prettier */
export type EncryptOutput<T extends EncryptPayload['value']> = 
    T extends string ? string : 
    T extends Uint8Array ? Uint8Array :
    never

export type EncryptPayloadOutput<T extends EncryptPayload> = 
    T extends { value: string } ? string : 
    T extends { value: Uint8Array } ? Uint8Array :
    never
/* eslint-enable prettier/prettier */

export function encrypt<T extends EncryptPayload>(
    payload: EncryptPayload
): EncryptPayloadOutput<T> {
    const options = validate(schema, payload)

    const salt = Buffer.from(options.salt, 'hex')
    const iv = Buffer.from(options.iv, 'hex')
    const key = crypto.scryptSync(options.password, salt, 32)
    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv)

    if ((options.value as any) instanceof Uint8Array) {
        const buffer = Buffer.concat([cipher.update(options.value), cipher.final()])

        return new Uint8Array(buffer) as any
    }

    if (typeof options.value === 'string') {
        const encrypted = cipher.update(options.value, 'utf8', 'hex')

        return (encrypted + cipher.final('hex')) as any
    }

    throw new Error('Invalid type')
}

export function decrypt<T extends EncryptPayload>(
    payload: EncryptPayload
): EncryptPayloadOutput<T> {
    const options = validate(schema, payload)

    const salt = Buffer.from(options.salt as string, 'hex')
    const iv = Buffer.from(options.iv as string, 'hex')
    const key = crypto.scryptSync(options.password, salt, 32)
    const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv)

    if (typeof options.value === 'string') {
        let decrypted = decipher.update(options.value, 'hex', 'utf8')

        decrypted += decipher.final('utf8')

        return decrypted as any
    }

    if (options.value instanceof Uint8Array) {
        const buffer = Buffer.concat([decipher.update(options.value), decipher.final()])

        return new Uint8Array(buffer) as any
    }

    throw new Error('Invalid type')
}

export function createEncryption(payload?: Partial<EncryptPayload>) {
    const state: Omit<EncryptPayload, 'value'> = {
        salt: payload?.salt || crypto.randomBytes(16).toString('hex'),
        iv: payload?.iv || crypto.randomBytes(16).toString('hex'),
        password: payload?.password || '',
    }

    const instance = {
        setSalt: function (salt: string) {
            state.salt = salt

            return instance
        },
        setIv: function (iv: string) {
            state.iv = iv

            return instance
        },
        setPassword: function (password: string) {
            state.password = password

            return instance
        },
        encrypt: function <T extends EncryptPayload['value']>(value: T) {
            return encrypt({ ...state, value }) as EncryptOutput<T>
        },
        decrypt: function <T extends EncryptPayload['value']>(value: T) {
            return decrypt({ ...state, value }) as EncryptOutput<T>
        },
    }

    return instance
}
