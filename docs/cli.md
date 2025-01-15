# Cli 

This doc explain how use this lib cli commands

## Config file

This is a file to make it easier to manage register and configure multiple databases and not have to pass the provider and config every time in the cli.

The files are searched in the following order:

- `$HOME/.config/db/config.yml`
- `$PWD/db.config.yml`
- `$PWD/.db.config.yaml`
- `$PWD/.db.config.json`

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
| where | `object` | `false` | Where statments to filter data |

### Examples

```bash
db list
```

```bash
db list --where "status=done"
```

```bash
db list --where "status[operator]=in&status[value]" # special operator 
```

```bash
db list --where "status=done&author=dio" # and 
```

```bash
db list --where "or[0][status]=done&or[1][author]=dio" # or
```

```bash
db list --where "@where.yml" # load file
```

```bash
db list --where '{"status": "done"}' # json format
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
db create --data "@new-task.yml"
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
| where | `object` | `false` | Where statments to filter data |

> [!WARNING] if where is not provided, all items will be updated

### Examples

```bash
db update --data "status=done" --where "id=01"
```

```bash
db update --data "@update-task.yml" --where "id=01"
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
| where | `object` | `false` | Where statments to filter data |

> [!WARNING] if where is not provided, all items will be deleted

### Examples

```bash
db destroy --where "id=01"
```

```bash
db destroy --where "@delete-task.yml"
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

You can load the value from a file by prefixing the string with `@`

Accepted formats are `yml`, `yaml`, `json`

```bash
db list --where "@query.yml" 
```

### json

You can pass a json string directly

```bash
db list --where '{"path": "data"}'
```
