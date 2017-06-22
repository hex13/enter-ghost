### Vifi - virtual file system library

examples:
```javascript

// we're importing vifi libary
const vifi = require('vifi/2');

// we create virtual file system (and we inject fs module)
const vfs = vifi(require('fs'));

// then we open file:
const file = vfs.open('some-file.txt');

```

then if you want to use promises you write this way:

```javascript
file.read().then(contents => {
    // notice - this is early version,
    // so now write only can replace content of file
    // appending is not implemented yet
    file.write(contents + '\n' + new Date)
});

```

or using async/await (Node 7+):

```javascript
async function someFunction() {
    const contents = await file.read();
    file.write(contents + '\n' + new Date)
}

someFunction();

```
