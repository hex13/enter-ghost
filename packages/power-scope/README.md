Power Scope is a static analysis tool (Work in progress, not ready for production yet).

It analyzes JavaScript files and gathers semantic information like:
- scopes
- variables
- structure of document (outline)

It's intended as library for use in e.g. editor extensions to implement such features like:
- go to definition
- autocomplete
etc.

Notice that it has semantic understand of the code (it understand which `foo` is the one cursor is at, and it understands `this`).
And these screenshots are only illustration (this is library, this is NOT editor extension! Although it can be used for make such extension)
![screenshot](https://raw.githubusercontent.com/hex13/enter-ghost/master/packages/power-scope/screenshot1.png)
![screenshot](https://raw.githubusercontent.com/hex13/enter-ghost/master/packages/power-scope/screenshot2.png)
