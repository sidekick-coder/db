import { createFilesystem } from '@/core/filesystem/createFilesystem.js';
import { createFsFake } from '@/core/filesystem/createFsFake.js';
import { list } from './list.js';
import { createEncryption } from './encryption.js';
import { validate } from '@/core/validator/validate.js';
import { schema as configSchema } from './config.js';
import { parsers } from '@/core/parsers/all.js';
import { lock } from './lock.js';

describe('list', () => {
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

    it('should list items in the vault', async () => {
        filesystem.mkdirSync(`${root}/item1`);
        filesystem.writeSync.text(`${root}/item1/index.json`, JSON.stringify({ id: 'item1', name: 'Item 1' }));
        filesystem.mkdirSync(`${root}/item2`);
        filesystem.writeSync.text(`${root}/item2/index.json`, JSON.stringify({ id: 'item2', name: 'Item 2' }));

        const result = await list({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            listOptions: {},
        });

        expect(result.data).toHaveLength(2);
        expect(result.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 'item1', name: 'Item 1' }),
                expect.objectContaining({ id: 'item2', name: 'Item 2' }),
            ])
        );
    });

    it('should apply filters to the list', async () => {
        filesystem.mkdirSync(`${root}/item1`);
        filesystem.writeSync.text(`${root}/item1/index.json`, JSON.stringify({ id: 'item1', name: 'Item 1' }));
        filesystem.mkdirSync(`${root}/item2`);
        filesystem.writeSync.text(`${root}/item2/index.json`, JSON.stringify({ id: 'item2', name: 'Item 2' }));

        const result = await list({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            listOptions: { where: { name: 'Item 1' } },
        });

        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toEqual(expect.objectContaining({ id: 'item1', name: 'Item 1' }));
    });

    it('should list items when they are encrypted by lock function', async () => {
        filesystem.mkdirSync(`${root}/item1`);
        filesystem.writeSync.text(`${root}/item1/index.json`, JSON.stringify({ id: 'item1', name: 'Item 1' }));
        filesystem.mkdirSync(`${root}/item2`);
        filesystem.writeSync.text(`${root}/item2/index.json`, JSON.stringify({ id: 'item2', name: 'Item 2' }));

        await lock({
            id: 'item1',
            encryption,
            filesystem,
            providerConfig: config,
        });

        const result = await list({
            filesystem,
            encryption,
            providerConfig: config,
            parser,
            listOptions: {},
        });

        expect(result.data).toHaveLength(2);
        expect(result.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 'item1', name: 'Item 1', encrypted: true }),
                expect.objectContaining({ id: 'item2', name: 'Item 2', encrypted: false }),
            ])
        );
    });
});
