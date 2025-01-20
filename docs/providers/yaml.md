# Yaml provider

This provider is a folder with a list of `.yaml` files

## Options

| name | Type | Description |
| --- | --- | --- |
| path | `string` | Absolute path to folder, or relative to the `db.config.yml`  file
| id | [IDStrategy](../id-strategy.md) | Id strategy to generate ids for the items in the database

## Computed properties

This are properties that are defined after the items are loaded and they are hidden by default, to show them you need to explicitly ask for them in `include` option or pass a empty array to `exclude` option to show all properties.

| name | Type | Description |
| --- | --- | --- |
| _id | `string` | folder basename treated as id
| _filename | `string` | file absolute path
| _raw | `string` | string content of the file

### Cli

```bash
db list --provider yaml --config "path=./data"

# or 

db list --provider yml --config "path=./data"
```

### Config

```yaml
databases:
    - name: mydb 
      provider: yaml # or yml
      config:
          path: ./data
```

### Programatic

```ts
import { createDb } from '@sidekick-coder/db/api';
import { createJsonProvider } from '@sidekick-coder/db/providers/yaml';
import { drive } from '@sidekick-coder/db/drive';
import { resolve } from 'path'

const db = createDb({
    providers: {
        yaml: createJsonProvider({ drive, ext: 'yaml' }),
        yml: createJsonProvider({ drive, ext: 'yml' }),
    },
})

const response = await db.list({
    provider: 'yaml',
    config: {
        path: resolve(process.cwd(), 'data')
     }
})

run()

```
