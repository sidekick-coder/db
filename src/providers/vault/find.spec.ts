import { createFilesystem } from '@/core/filesystem/createFilesystem.js';
import { createFsFake } from '@/core/filesystem/createFsFake.js';
import { find } from './find.js';
import { createEncryption } from './encryption.js';
import { validate } from '@/core/validator/validate.js';
import { schema as configSchema } from './config.js';
import { parsers } from '@/core/parsers/all.js';
import { lock } from './lock.js';

describe('find', () => {
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

    it('should find an item in the vault', async () => {
        filesystem.mkdirSync(`${root}/item1`);
        filesystem.writeSync.text(`${root}/item1/index.json`, JSON.stringify({ id: 'item1', name: 'Item 1' }));

        const result = await find({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            findOptions: { where: { id: 'item1' } },
            makeId: async () => 'item1',
        });

        expect(result).toEqual(expect.objectContaining({ id: 'item1', name: 'Item 1' }));
    });

    it('should return null if item is not found', async () => {
        const result = await find({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            findOptions: { where: { id: 'nonexistent' } },
            makeId: async () => 'nonexistent',
        });

        expect(result).toBeNull();
    });

    it('should find an item when it is encrypted by lock function', async () => {
        filesystem.mkdirSync(`${root}/item1`);
        filesystem.writeSync.text(`${root}/item1/index.json`, JSON.stringify({ id: 'item1', name: 'Item 1' }));

        await lock({
            id: 'item1',
            encryption,
            filesystem,
            providerConfig: config,
        });

        const result = await find({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            findOptions: { where: { id: 'item1' } },
            makeId: async () => 'item1',
        });

        expect(result).toEqual(expect.objectContaining({ id: 'item1', name: 'Item 1', encrypted: true }));
    });
});
