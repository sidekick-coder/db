import { rootPath } from '@/utils/usePath.js'
import { CommandDefinition } from './types.js'
import { importAll } from '@/utils/importAll.js'

const register = new Map<string, CommandDefinition>()

export function addCommand(name: string, definition: CommandDefinition) {
    register.set(name, definition)
}

export async function listCommands() {
    await importAll(rootPath('commands'))

    return Array.from(register.values())
}
