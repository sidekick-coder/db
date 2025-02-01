<div align="center">

# db

A simple tool to manage your data  
[npm](https://www.npmjs.com/package/@sidekick-coder/compositor)

</div>


## Installation

```bash
npm install -g @sidekick-coder/db
```

## Simple usage

Create db.config.yml

```yaml
default_database: tasks
databases:
    - name: tasks
      provider: markdown
      config:
        path: ./tasks-folder # path to the folder with markdown files
```

```bash
db list --where status=done # list 

db find --where id=01 # find single item

db create --data "title=New task&status=todo&body=This is a new task" # create new item

db update --data "status=done" --where id=01 # update item

db destroy --where id=01 # delete item
```


## Providers 

- [Markdown](./docs/providers/markdown.md)
- [Json](./docs/providers/json.md)
- [Folder](./docs/providers/folder.md)
- [Notion](./docs/providers/notion.md)

## Database

A database in the context of this lib refers to any data that can be converted to an array of objects.

Examples can be:

- list of plain text files with key value pairs
- list of markdown file with frontmatter
- list of json files
- list of folders
- list of rows from a SQL Table (Postgres, MySQL, etc)
- etc...



## Config file

The config file helps to use and manage your databases

The files are searched in the following order:

- `$HOME/.config/db/config.yml`
- `$PWD/db.config.yml`
- `$PWD/db.config.yaml`
- `$PWD/db.config.json`

If you want to use a different name, you can pass the file path as a flag in the cli.

```bash
db --db-config "path/to/config.yml"
```

Config sample

```yaml 
# database name to run by default
default_database: my_notes 

# list of databases with provider and config
databases: 
    - name: my_notes
      provider: markdown
      config:
        path: /data/notes
      default_view: todo_tasks
      views:
        - name: done_tasks
          where:
            status: done
        - name: todo_tasks
          where:
            status: todo
        - "all_tasks.yml" # load from file
        - "views/*.yml" # load all files in folder

    - name: my_sql_db
      provider: sql
      config:
        dialect: postgres
        host: localhost
        port: 5432
        user: user
        password: password
        database: my_db

    - name: my_custom_provider_1
      provider: ./my-custom-provider.js

    - name: my_custom_provider_2 
      provider: custom

# register extra providers using custom js files
providers:
    - name:  custom
      path: ./my-custom-provider.js
```

Select the databse with the `--database` flag

```bash
db list --database my_notes

# or short version 

db list -d my_notes
```

## List

List items in the database

### Options

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| provider | `string` | if not usign config file | Provider name |
| config | `object` | if not usign config file | Provider configuration |
| where | `object` | `false` | Where statments to filter data [see filters](./docs/filters.md) |
| include | `array` | `false` | Include properties |
| exclude | `array` | `false` | Exclude properties |

### Examples

```bash
db list
```

```bash
db list --where "status=done"
```

## Find 

Find a single item in the database

### Options

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| provider | `string` | if not usign config file | Provider name |
| config | `object` | if not usign config file | Provider configuration |
| where | `object` | `false` | Where statments to filter data [see filters](./docs/filters.md) |
| include | `array` | `false` | Include properties |
| exclude | `array` | `false` | Exclude properties |

### Examples

```bash
db find
```

```bash
db find --where "status=done"
```

## Create

Create a new item in the database

### Options

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| provider | `string` | if not usign config file | Provider name |
| config | `object` | if not usign config file | Provider configuration |
| data | `object` | `true` | Data to be updated |

### Examples

```bash
db create --data "title=New task&status=todo&body=This is a new task"
```

```bash
db create --data "new-task.yml"
```

```bash
db create --data '{"title": "New task", "status": "todo", "body": "This is a new task"}'
```

## Update

Update an item in the database

### Options

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| provider | `string` | if not usign config file | Provider name |
| config | `object` | if not usign config file | Provider configuration |
| data | `object` | `true` | Data to be updated |
| where | `object` | `false` | Where statments to filter data [see filters](./docs/filters.md) |

> [!WARNING] if where is not provided, all items will be updated

### Examples

```bash
db update --data "status=done" --where "id=01"
```

```bash
db update --data "update-task.yml" --where "id=01"
```

```bash
db update --data '{"status": "done"}' --where "id=01"
```

## Destroy

Delete an item in the database

### Options

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| provider | `string` | if not usign config file | Provider name |
| config | `object` | if not usign config file | Provider configuration |
| where | `object` | `false` | Where statments to filter data [see filters](./docs/filters.md) |

> [!WARNING] if where is not provided, all items will be deleted

### Examples

```bash
db destroy --where "id=01"
```

```bash
db destroy --where "delete-task.yml"
```

```bash
db destroy --where '{"id": "01"}'
```

## Variables

Some cli flags accept a special format that can help use complex data structures, similar to ansible variables.

### key value

simple key value pairs.

```bash
db list --where "path=data" 
```

### load from file

You can load the value from a file by adding the extension to the value

Accepted formats are `yml`, `yaml`, `json`

```bash
db list --where "query.yml" 
```

### json

You can pass a json string directly

```bash
db list --where '{"path": "data"}'
```

## Views 

Views are predefined options to filter, sort and format data

```yaml
# only query filter in query
include: [id, title, status]

# exclude properties
exclude: [body]

# sort by
sort-by: id
sort-desc: true

# where statments
where: 
    status: done

render: console # render to use
render_options:
    columns:
        - label: ID
          value: id
          width: 3 # 3% terminal width

        - label: Status
          value: status
          width: 10 # 10% terminal width

        - label: Project
          value: project
          width: 10 # 10% terminal width

        - label: Title
          value: title
          # auto width, fill the rest of the terminal width
```

```bash
# load by name
db list --view "done-tasks"

# load by file
db list --view "done-tasks.yml"
```

## Renders [WIP]

Renders are the ways you can display the data 

It can be a console.log in the terminal, or open a browser with a table.

You can declare them in the config file or in the cli

```yaml
# db.config.yml
default_render: ui
renders:
    - name: ui
      render: "/home/{username}/db-renders/ui.js"   
```

## Programatic usage 

You can use this lib as a js module importing with the example bellow 

> [!IMPORTANT] In this enviroment config paths and dynamic providers are not resolved so you have to use explicit values in variables

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
