import { createFilesystem } from '@/core/filesystem/createFilesystem.js';
import { createFsFake } from '@/core/filesystem/createFsFake.js';
import { update } from './update.js';
import { createEncryption } from './encryption.js';
import { validate } from '@/core/validator/validate.js';
import { schema as configSchema } from './config.js';
import { parsers } from '@/core/parsers/all.js';
import { lock } from './lock.js';

describe('update', () => {
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

    it('should update an item in the vault', async () => {
        filesystem.mkdirSync(`${root}/item1`);
        filesystem.writeSync.text(`${root}/item1/index.json`, JSON.stringify({ id: 'item1', name: 'Item 1' }));

        const result = await update({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            updateOptions: { where: { id: 'item1' }, data: { name: 'Updated Item 1' } },
        });

        expect(result.count).toBe(1);
        const updatedItem = JSON.parse(filesystem.readSync.text(`${root}/item1/index.json`));
        expect(updatedItem).toEqual(expect.objectContaining({ id: 'item1', name: 'Updated Item 1' }));
    });

    it('should update multiple items in the vault', async () => {
        filesystem.mkdirSync(`${root}/item1`);
        filesystem.writeSync.text(`${root}/item1/index.json`, JSON.stringify({ id: 'item1', name: 'Item 1' }));
        filesystem.mkdirSync(`${root}/item2`);
        filesystem.writeSync.text(`${root}/item2/index.json`, JSON.stringify({ id: 'item2', name: 'Item 2' }));

        const result = await update({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            updateOptions: { where: {}, data: { description: 'Updated description' } },
        });

        expect(result.count).toBe(2);
        const updatedItem1 = JSON.parse(filesystem.readSync.text(`${root}/item1/index.json`));
        const updatedItem2 = JSON.parse(filesystem.readSync.text(`${root}/item2/index.json`));
        expect(updatedItem1).toEqual(expect.objectContaining({ id: 'item1', name: 'Item 1', description: 'Updated description' }));
        expect(updatedItem2).toEqual(expect.objectContaining({ id: 'item2', name: 'Item 2', description: 'Updated description' }));
    });

    it('should not update any items if none match the criteria', async () => {
        filesystem.mkdirSync(`${root}/item1`);
        filesystem.writeSync.text(`${root}/item1/index.json`, JSON.stringify({ id: 'item1', name: 'Item 1' }));

        const result = await update({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            updateOptions: { where: { id: 'nonexistent' }, data: { name: 'Updated Item' } },
        });

        expect(result.count).toBe(0);
        const item = JSON.parse(filesystem.readSync.text(`${root}/item1/index.json`));
        expect(item).toEqual(expect.objectContaining({ id: 'item1', name: 'Item 1' }));
    });

    it('should update an item when it is encrypted by lock function', async () => {
        filesystem.mkdirSync(`${root}/item1`);
        filesystem.writeSync.text(`${root}/item1/index.json`, JSON.stringify({ id: 'item1', name: 'Item 1' }));

        await lock({
            id: 'item1',
            encryption,
            filesystem,
            providerConfig: config,
        });

        const result = await update({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            updateOptions: { where: { id: 'item1' }, data: { name: 'Updated Item 1' } },
        });

        expect(result.count).toBe(1);
        const updatedItem = JSON.parse(filesystem.readSync.text(`${root}/item1/index.json`));
        expect(updatedItem).toEqual(expect.objectContaining({ id: 'item1', name: 'Updated Item 1' }));
    });
});
