<div align="center">

# db

A simple cli to manage your data  
[npm](https://www.npmjs.com/package/@sidekick-coder/compositor)

</div>

## Roadmap

- [x] markdown provider
- [x] folder provider
- [x] json provider
- [ ] yaml provider
- [ ] sql provider
- [ ] csv provider

- [ ] aggregation command (sum, avg, group by, etc)

## Installation

```bash
npm install -g @sidekick-coder/db
```

## Simple usage

```bash
db list --provider markdown --config "path=tasks-folder"  --where status=done

# or with db.config.yml

db list --where status=done
```

## Database

A database in the context of this lib refers to a list of items that can or cannot have strict structure.

Examples can be:

- list of plain text files
- list of markdown file
- list of json files
- list of folders
- list of rows from a SQL Table (Postgres, MySQL, etc)
- etc...

Basically, any data that can be converted to an array of objects with properties can be considered a database in this context.

## Usage 

There are 2 ways to use this lib, `cli` and `progragramatic`.

Check the dedicated doc file to know the details:

- [Cli](./docs/cli.md)
- [Programatic](./docs/programatic.md)

