import { createFilesystem } from '@/core/filesystem/createFilesystem.js';
import { createFsFake } from '@/core/filesystem/createFsFake.js';
import { destroy } from './destroy.js';
import { createEncryption } from './encryption.js';
import { validate } from '@/core/validator/validate.js';
import { schema as configSchema } from './config.js';
import { parsers } from '@/core/parsers/all.js';
import { lock } from './lock.js';

describe('destroy', () => {
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

    it('should destroy items based on the provided options', async () => {
        const destroyOptions = {
            where: { id: '1' },
            limit: 1,
        };

        filesystem.readdirSync = jest.fn().mockReturnValue(['1', '2']);
        filesystem.existsSync = jest.fn().mockReturnValue(true);
        filesystem.readSync = jest.fn().mockReturnValue(
            JSON.stringify({
                id: '1',
                name: 'Item 1',
            })
        );
        filesystem.removeSync = jest.fn();

        const result = await destroy({
            filesystem,
            destroyOptions,
            providerConfig: config,
            encryption,
            parser,
        });

        expect(result.count).toBe(1);
        expect(filesystem.removeSync).toHaveBeenCalledWith('/vault/1');
    });

    it('should not destroy items if no matching items are found', async () => {
        const destroyOptions = {
            where: { id: '3' },
            limit: 1,
        };

        filesystem.readdirSync = jest.fn().mockReturnValue(['1', '2']);
        filesystem.existsSync = jest.fn().mockReturnValue(true);
        filesystem.readSync = jest.fn().mockReturnValue(
            JSON.stringify({
                id: '1',
                name: 'Item 1',
            })
        );
        filesystem.removeSync = jest.fn();

        const result = await destroy({
            filesystem,
            destroyOptions,
            providerConfig: config,
            encryption,
            parser,
        });

        expect(result.count).toBe(0);
        expect(filesystem.removeSync).not.toHaveBeenCalled();
    });
});
