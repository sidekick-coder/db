# Json provider

This provider is a folder with a list of `.json` files

## Options

| name | Type | Description |
| --- | --- | --- |
| path | `string` | Absolute path to folder, or relative to the `db.config.yml`  file
| id | [IDStrategy](../id-strategy.md) | Id strategy to generate ids for the items in the database

### Cli

```bash
db list --provider json --config "path=./data"
```

### Config

```yaml
databases:
    - name: mydb 
      provider: json 
      config:
          path: ./data
```

### Programatic

```ts
import { createDb } from '@sidekick-coder/db/api';
import { createJsonProvider } from '@sidekick-coder/db/providers/json';
import { drive } from '@sidekick-coder/db/drive';
import { resolve } from 'path'

const db = createDb({
    providers: {
        json: createJsonProvider(drive),
    },
})

const response = await db.list({
    provider: 'json',
    config: {
        path: resolve(process.cwd(), 'data')
     }
})

run()

```
