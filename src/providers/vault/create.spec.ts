import { createFilesystem } from '@/core/filesystem/createFilesystem.js';
import { createFsFake } from '@/core/filesystem/createFsFake.js';
import { create } from './create.js';
import { createEncryption } from './encryption.js';
import { validate } from '@/core/validator/validate.js';
import { schema as configSchema } from './config.js';
import { parsers } from '@/core/parsers/all.js';
import { lock } from './lock.js';

describe('create', () => {
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

    it('should create an item in the vault', async () => {
        const result = await create({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            createOptions: { data: { name: 'Item 1' } },
            makeId: async () => 'item1',
        });

        expect(result).toEqual(expect.objectContaining({ id: 'item1', name: 'Item 1' }));
        expect(filesystem.existsSync(`${root}/item1/index.json`)).toBe(true);
    });

    it('should throw an error if item already exists', async () => {
        filesystem.mkdirSync(`${root}/item1`);
        filesystem.writeSync.text(`${root}/item1/index.json`, JSON.stringify({ id: 'item1', name: 'Item 1' }));

        await expect(
            create({
                filesystem,
                encryption,
                providerConfig: config,
                parser,
                createOptions: { data: { id: 'item1', name: 'Item 1' } },
                makeId: async () => 'item1',
            })
        ).rejects.toThrow('Item with id "item1" already exists');
    });

    it('should check if the created item is encrypted', async () => {
        const result = await create({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            createOptions: { data: { name: 'Item 1' } },
            makeId: async () => 'item1',
        });

        await lock({
            id: 'item1',
            encryption,
            filesystem,
            providerConfig: config,
        });

        const encryptedItem = await create({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            createOptions: { data: { name: 'Item 2' } },
            makeId: async () => 'item2',
        });

        expect(encryptedItem).toEqual(expect.objectContaining({ id: 'item2', name: 'Item 2' }));
        expect(filesystem.existsSync(`${root}/item2/index.json`)).toBe(true);
        expect(filesystem.existsSync(`${root}/item2/${encryption.encrypt('index.json')}`)).toBe(true);
    });
});
