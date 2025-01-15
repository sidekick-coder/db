# Markdown provider

This provider is a folder with a list of `.md` files

## Options

| name | Type | Description |
| --- | --- | --- |
| path | string | Folder where to keep markdown files, is an absolute path or relative to the `db.config.yml`  file

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
