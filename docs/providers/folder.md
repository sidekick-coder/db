# Folder provider

This provider is a folder with a list of other folders that each folder represents a item

And normaly the properties of the item are saved in a `index.(md|json)`

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
