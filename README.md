# db

## Tasks

- [x] setup cli commands
- [x] read config file
- [ ] provider manager
- [ ] command: list
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
