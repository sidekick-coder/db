<div align="center">

# db

A simple tool to manage your data  
[npm](https://www.npmjs.com/package/@sidekick-coder/db)

> [!DANGER] The project is in alpha phase, please don't use in production
</div>


## Installation

```bash
npm install -g @sidekick-coder/db
```

## Usage 

Create db.config.yml

```yaml
name: tasks
provider:
  name: file
  config:
    format: markdown
    path: ./tasks-folder # path to the folder with markdown files
```

```bash
db list --where "status=done" # list 

db find --where "id=01" # find single item

db create --data "title=New task&status=todo&body=This is a new task" # create new item

db update --data "status=done" --where "id=01" # update item

db destroy --where "id=01" # delete item
```

## Providers 

- [File](./docs/providers/file.md)
- [Folder](./docs/providers/folder.md)
- [Notion](./docs/providers/notion.md)
- [Vault](./docs/providers/vault.md)

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

The config file is a yaml file that defines the one or more databases definitions.

The cli will always look for a the `db.config.yml` file in the current directory, unless you pass a different path as a flag.

```bash 
db -f "path/to/config.yml"
```

### Single Database config sample

```yaml 
name: tasks
provider:
    name: file
    config:
        path: data
        format: markdown
        id_strategy: increment
view:
    default: default
    sources:
        dirs: views
        files: [./views/default.yml]
        items:
            - name: archived
              where:
                  archived: false
```

### Multiple Databases config sample

```yaml 
databases:
    default: tasks
    sources:
        files: ["content/tasks/db.config.yml"]
        patterns: ["content/*/db.config.yml"]
        items:
            - name: tags
              provider:
                  name: file
                  config:
                      path: ./content/tags/data

            - name: code-snippets
              provider:
                  name: file
                  config:
                      path: content/code-snippets/data
```

Select the databse with the `--database` flag

```bash
db list --database tags

# or short version 

db list --db tags
```

## List

List items in the database

### Options

| Option | Type | Required | Description |
| --- | --- | --- | --- |
| where | `object` | `false` | Where statments to filter data [see filters](./docs/filters.md) |
| limit | `number` | `false` | Limit the number of items if provider supports |
| page | `number` | `false` | Page number if provider supports number pagination |
| cursor | `string` | `false` | Cursor to start from if provider supports cursor pagination |
| include | `array` | `false` | Include properties |
| exclude | `array` | `false` | Exclude properties |
| sort-by | `string` | `false` | Sort by property | 
| sort-desc | `boolean` | `false` | Sort descending |

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
