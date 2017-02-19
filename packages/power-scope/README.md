# Performs analysis of JS files and returns scopes, variables, objects. Allows for querying.

** WIP (still not ready for serious use, but keep watching) **

* gathers scopes and variables declared within them
* gathers object properties
* can follow requires and understands module.exports
* has DSL for making code queries


```javascript
const assert = require('assert');
const analyze = require('power-scope/traverse');
const { queryWithString } = require('power-scope/query');
// `vifi` is virtual file system library
// power scope takes as argument array of virtual files
// which are either `vifi` files or are compatible with them.
const vfs = require('vifi');

const code = `
function abc() {
    const foo = {a: 'bar', b: 'bbb'};
    foo.a = 'baz'; // inference of assignments
}
`;
const file = vfs.File({path: 'main.js', contents: code});

analyze([file]).then(result => {
    let value;
    const mainScope = result.files[0].scopes[0];

    // straightforward (low level) way:
    value = mainScope.vars.get('abc').value.vars.get('foo').value.props.get('a').value;
    assert.equal(value, 'baz');
    // or syntax sugared query with DSL:
    value = queryWithString(mainScope, '@abc @foo.a').value;
    assert.equal(value, 'baz');

    value = queryWithString(mainScope, '@abc @foo.b').value;
    assert.equal(value, 'bbb');

});

```
If you're interested in watching progress, look:
https://github.com/hex13/enter-ghost/tree/master/packages/power-scope

More examples of usage can be found in tests:
https://github.com/hex13/enter-ghost/tree/master/packages/power-scope/test/

If you are interested how this library works under the hood read this file (this is where main analysis is going on):
https://github.com/hex13/enter-ghost/blob/master/packages/power-scope/visitor.js
