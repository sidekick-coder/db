# db

## Tasks

- [x] setup cli commands
- [x] read config file
- [ ] provider manager
- [x] command: list
- [ ] command: create
- [ ] command: update
- [ ] command: delete

## Good to have

- [ ]  add tests
- [ ]  add aggregation command (sum, avg, group by, etc)

## Usage

```zsh
db list --provider markdown --config "path=./playground/markdown&include[]=filename" --where "tags[value]=test&tags[operator]=in"
```

## Variables

Some cli flags accept a special format that can help use complex data structures, similar to ansible variables.

- key value pairs
    description: simple key value pairs.
    Example: `tags[value]=test&tags[operator]=in`

- yml format
    description: You can prefix the value with `@` to load a file with yml content, is important to have the yml/yaml extension
    Example: `@./config.yml`

- json format
    description: You can prefix the value with `#` to load a file with json content.
    Example: `#./config.json`

## List

List data

### Options

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| provider | string | true |  | Provider name |
| config | vars | true |  | Provider configuration |
| where | vars | false |  | Where statments to filter data |

### Examples

```zsh
db list --provider markdown --config "path=data" 

```

```zsh
db list --provider markdown --config "@config.yml" // load config from file $PWD/config.yml

```

```zsh
db list --provider markdown --config "path=data"  --where "tags[value]=test&tags[operator]=in"
```

```zsh
db list --provider markdown --config "path=data"  --where "@common-queries/in-progress.yml"
```

