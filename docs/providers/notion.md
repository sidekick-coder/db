# Notion provider

This provider use a database from notion as a data source.

## Options

| name | Type | Description |
| --- | --- | --- |
| path | `string` | Folder path, an absolute path or relative to the `db.config.yml` file
| secret_token | `string` | Notion token key to access the database 
| database_id | `string` | Notion database id 

## Computed properties

This are properties that are defined after the items are loaded and they are hidden by default, to show them you need to explicitly ask for them in `include` option or pass a empty array to `exclude` option to show all properties.

> Note: This properties are not filterable

| name | Type | Description |
| --- | --- | --- |
| _id | `string` | Notion page id
| _raw | `object` | Raw notion page object

### Cli

```bash
db list --provider notion --config "secret_key=secret_key&database_id=database_id"
```

### Config

```yaml
databases:
    - name: mydb 
      provider: folder 
      config:
        secret_key: secret_key
        database_id: database_id
```

### Programatic

```ts
import { createDb } from '@sidekick-coder/db/api';
import { createNotionProvider } from '@sidekick-coder/db/providers/notion';

const db = createDb({
    providers: {
        folder: createNotionProvider(),
    },
})

const response = await db.list({
    provider: 'notion',
    config: {
        secret_token: "...",
        database_id: "..."
     }
})

run()

```
