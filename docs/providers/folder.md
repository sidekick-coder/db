# Folder provider

This provider is a folder with a list of other folders that each folder represents a item

And normaly the properties of the item are saved in a `index.(md|json)`

## Options

| name | Type | Description |
| --- | --- | --- |
| path | `string` | Folder path, an absolute path or relative to the `db.config.yml` file
| format | `markdown \| json` | Format to save `index` file default markdown

### Cli

```bash
db list --provider folder --config "path=./data"
```

### Config

```yaml
databases:
    - name: mydb 
      provider: folder 
      config:
          path: ./data 
          # format: json -- optional
```

### Programatic

```ts
import { createDb } from '@sidekick-coder/db/api';
import { createFolderProvider } from '@sidekick-coder/db/providers/folder';
import { drive } from '@sidekick-coder/db/drive';
import { resolve } from 'path'

const db = createDb({
    providers: {
        folder: createFolderProvider(drive),
    },
})

const response = await db.list({
    provider: 'folder',
    config: {
        path: resolve(process.cwd(), 'data')
        // format: 'json' -- optional
     }
})

run()

```
