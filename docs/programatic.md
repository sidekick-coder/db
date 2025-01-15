# Programatic 

You can use this lib as a js module importing with the example bellow 

> [!IMPORTANT] In this enviroment config paths and dynamic providers are not resolved so you have to explicit values in variables

```js 
import { createDb } from '@sidekick-coder/db/api';
import { createMarkdownProvider } from '@sidekick-coder/db/providers/markdown';
import { createJsonProvider } from '@sidekick-coder/db/providers/json';
import { drive } from '@sidekick-coder/db/drive';

const db = createDb({
    default_database: 'test',
    providers: {
        markdown: createMarkdownProvider(drive),
        json: createJsonProvider(drive)
    },
    databases: [
        {
            name: 'markdown',
            provider: 'markdown',
            config: {
                path: '/home/{username}/data/markdown',
            }
        },
        {
            name: 'json',
            provider: 'json',
            config: {
                path: '/home/{username}/data/json',
            }
        }
    ]
})

async function run(){
    const markdownResponse = await db.list()

    db.select('json')

    const jsonResponse = await db.list()
}

run()

```
