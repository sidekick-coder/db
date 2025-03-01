# Vault Provider 

This provider is used have a database with encrypted items. 

A password is required to create, update or delete items in the database.



## Options

| name | Type | Description |
| --- | --- | --- |
| path | `string` | Folder path, an absolute path or relative to the `db.config.yml` file
| format | `markdown \| json \| yaml \| yml` | Format to save `index` file
| id_strategy | `incremental \| uuid` | Id strategy to generate ids for the items in the database

## Computed properties

This are properties that are defined after the items are loaded and they are hidden by default, to show them you need to explicitly ask for them in `include` option or pass a empty array to `exclude` option to show all properties.

| name | Type | Description |
| --- | --- | --- |
| id | `string` | folder basename treated as id
| folder | `string` | Folder absolute path
| raw | `string` | Content of the `index` file
| encrypted | `boolean` | True If the item is encrypted

### Config

```yaml
name: medias
provider:
    name: folder
    config:
        path: data 
        format: markdown
        id_strategy: increment
```

## Usage

Before making operations in the database you need to set the password by initializing the provider, to do that simple run the following command:

```bash 
db init
```
Then after that to make operations you need to be authenticated, to do that you need to run the following command:

```bash
db auth
```
Finally you can make operations in the database, for example to create a new item you can run the following command:

```bash 
db create --data "name: 'John Doe'"
```

## Init 

This command is used to initialize the provider, it will ask for a password and will store some important metadata for authentication in `database-path/.db/metadata.json`

```bash
db init
```

You can also pass the password, salt and iv as arguments, for example:

```bash 
db init --password "my-password" --salt "my-salt" --iv "my-iv"
```

The database can be initialized only one time, if you wanna reset it you need to use `--force` flag.

> [!DANGER] Keep in mind that if you reset the database and change the password, previous **locked** items will not be readable anymore

```bash 
db init --force
```

## Auth

This command is used to authenticate the user, it will ask for the password and will store in raw text in `database-path/.db/password`

```bash 
db auth
```
To "logout" you can just remove the `database-path/.db/password` file

```bash 
rm database-path/.db/password
```

In windows the file is scheduled to be automatically deleted after 1 hour, you can customize this with `--timeout` flag, for example:

```bash
db auth --timeout 15m # delete after 15 minutes 
```

## Unlock/Lock 

If you want to edit the item properties and/or any other file inside the item folder you can unlock the item with:

```bash
db unlock --id 1
``` 
This will decrypt all files in the item folder and you can edit them, add other files, etc.

After you finish editing you can lock the item again with:

```bash
db lock --id 1
```
This will encrypt all files inside the item folder

Also the provider knows which files are encrypted, so when you add new files inside the items folder you can just lock it and the script will encrypt only the files that are not encrypted yet

> [!WARNING] For now only top level files are supported

