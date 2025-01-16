# Id Stategy

This is a helper to generate ids for the items in the database.

There are 3 strategies available:

- `uuid` - Generate a random uuid
- `increment` - Generate a incremental number
- `date` - Generate a date string

Only some providers support this feature, so check the provider documentation to know if it is supported.

## Usage

```yaml
databases:
    - name: mydb 
      provider: folder 
      config:
        id:
            strategy: increment
```


## UUID 

Generate a random uuid

```yaml
databases:
    - name: mydb 
      provider: folder 
      config:
        id:
            strategy: uuid
```

## Increment 

Generate a incremental number

The last id is saved in metadata file in `$dbPath/.db/last_id.json`

```yaml 
databases:
    - name: mydb 
      provider: folder 
      config:
        id:
            strategy: increment
```

## Date 

Generate a date string

```yaml 
databases:
    - name: mydb 
      provider: folder 
      config:
        id:
            strategy: date
            pattern: 'yyyy-MM-dd'
```
