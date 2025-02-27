import { createFilesystem } from '@/core/filesystem/createFilesystem.js';
import { createFsFake } from '@/core/filesystem/createFsFake.js';
import { lock } from './lock.js';
import { createEncryption } from './encryption.js';
import { validate } from '@/core/validator/validate.js';
import { schema as configSchema } from './config.js';
import { parsers } from '@/core/parsers/all.js';

describe('lock', () => {
    const root = '/vault';
    const config = validate(configSchema(root), {
        format: 'json',
        path: root,
        id_strategy: 'increment',
        password: 'test-password',
    });
    const filesystem = createFilesystem({ fs: createFsFake() });
    const encryption = createEncryption().setPassword(config.password);
    const parser = parsers.find((p) => p.name === config.format);

    it('should lock an item in the vault', async () => {
        filesystem.mkdirSync(`${root}/item1`);
        filesystem.writeSync.text(`${root}/item1/index.json`, JSON.stringify({ id: 'item1', name: 'Item 1' }));

        const result = await lock({
            id: 'item1',
            encryption,
            filesystem,
            providerConfig: config,
        });

        expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'index.json', encrypted: true })]));
        expect(filesystem.existsSync(`${root}/item1/index.json`)).toBe(false);
        expect(filesystem.existsSync(`${root}/item1/${encryption.encrypt('index.json')}`)).toBe(true);
    });

    it('should throw an error if item is not found', async () => {
        await expect(
            lock({
                id: 'nonexistent',
                encryption,
                filesystem,
                providerConfig: config,
            })
        ).rejects.toThrow('Item nonexistent not found');
    });

});
