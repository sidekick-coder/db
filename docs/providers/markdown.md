# Markdown provider

This provider is a folder with a list of `.md` files

## Options

| name | Type | Description |
| --- | --- | --- |
| path | `string` | Absolute path to folder, or relative to the `db.config.yml`  file
| id | [IDStrategy](../id-strategy.md) | Id strategy to generate ids for the items in the database

## Computed properties

This are properties that are defined after the items are loaded and they are hidden by default, to show them you need to explicitly ask for them in `include` option or pass a empty array to `exclude` option to show all properties.

| name | Type | Description |
| --- | --- | --- |
| id | `string` | folder basename treated as id
| filename | `string` | file absolute path
| raw | `string` | string content of the file

### Cli

```bash
db list --provider markdown --config "path=./data"
```

### Config

```yaml
databases:
    - name: mydb 
      provider: markdown 
      config:
          path: ./data
```

### Programatic

```ts
import { createDb } from '@sidekick-coder/db/api';
import { createMarkdownProvider } from '@sidekick-coder/db/providers/markdown';
import { drive } from '@sidekick-coder/db/drive';
import { resolve } from 'path'

const db = createDb({
    providers: {
        markdown: createMarkdownProvider(drive),
    },
})

const response = await db.list({
    provider: 'markdown',
    config: {
        path: resolve(process.cwd(), 'data')
     }
})

run()

```
