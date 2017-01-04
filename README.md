# enter-ghost
WIP Mystery tool that transforms JavaScript virtual file systems 👻🎃🔮

version is 0.0.2 which reflects maturity and stability of the project ;)

- virtual file system library (vifi package)
Which will allow for using one virtual system model across platforms (NodeJS, Browser), storage type (disk, memory, ajax-requests etc.).

- code editor application (enter-ghost-ide package)

- frontend of code editor (enter-ghost-gui-\*)

- backend of code editor (enter-ghost-workspace, enter-ghost-doc, enter-ghost-app)

- event based debugger/recorder (enter-ghost-debug)

- AST transformation tools

Installing (it will be simplified soon):

```
git clone https://github.com/hex13/enter-ghost
cd enter-ghost
npm install
node_modules/.bin/lerna bootstrap
cd packages/enter-ghost-plugin-git
node_modules/.bin/electron-rebuild --version=1.4.7
cd ../enter-ghost-ide
npm start
```

 ⌘O to open (it's WIP so only `*.js` files supported for now. Other files will open without proper syntax highlighting etc.)

After you open directory, application treat it as a project root:

1. on the left side there will be Folder Tree view,
2. pressing ⌘P will display Find File view.
