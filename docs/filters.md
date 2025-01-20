# Filter

Filter follow this structure:

```json
{
    "field": "name",
    "operator": "eq",
    "value": "John"
}
```

You can also use a shorthand for the `eq` operator:

```js
{
    "name": "John" // this is internally converted to { "field": "name", "operator": "eq", "value": "John" }
}
```

### Multiple filters 
You can use the `and` & `or` operator to combine multiple filters and create complex queries.

```json
{
        "and": [
            {
                "field": "name",
                "operator": "eq",
                "value": "John"
            },
            {
                "field": "age",
                "operator": "gt",
                "value": 18
            }
        ]
    }
```

```json
{
        "or": [
            {
                "field": "name",
                "operator": "eq",
                "value": "John"
            },
            {
                "field": "age",
                "operator": "gt",
                "value": 18
            }
        ]
    }
```

### Examples

#### Normal filter
```bash
db list --where "status=done"
```
```bash 
db list --where "status=done&author=dio"
```
```bash 
db list --where "or[0][status]=done&or[1][author]=dio"
```

#### Filter with JSON
```bash
db list --where '{"status": "done" }' 
```
```bash 
db list --where '{"status": "done", "author": "dio" }' 
```
```bash
db list --where '{"or": [{"status": "done"}, {"author": "dio"}] }' 
```

#### Filter with file
Complex filters can be a little verbose to do in a inline, so you can also use a file to express the filter.

##### YAML

```bash
db list --where "@query.yml" # load file
```

```yaml
# query.yml
or:
    - and:
        - field: status
          operator: eq
          value: done
        - field: author
          operator: eq
          value: dio
    - field: age
        operator: gt
        value: 18
```

##### JSON

```bash
db list --where "@query.json" # load file
```

```js
// query.json
{
    "or": [
        {
            "and": [
                {
                    "field": "status",
                    "operator": "eq",
                    "value": "done"
                },
                {
                    "field": "author",
                    "operator": "eq",
                    "value": "dio"
                }
            ]
        },
        {
            "field": "age",
            "operator": "gt",
            "value": 18
        }
    ]
}
```
