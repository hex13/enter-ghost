const assert = require('assert');
const originalRequire = require;

// TODO idea:
// replace assert.equal with console.log in examples like this:
// in spec:
// assert.equal(mainScope.vars.get('abc').value.vars.get('foo').value, 'bar');
// gets in docs:
// console.log(mainScope.vars.get('abc').value.vars.get('foo').value); // => 'bar'

describe('example', () => {
    const require = (name) => {
        name = name.replace('power-scope', '..');
        return originalRequire(name);
    };

    it('should work :)', () => {
        // @example for power-scope
        let $$result;
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

        // @example replace line with
        // analyze([file]).analysis.then(result => {
        // or autocleaning:
        // clean assignment where left.name = '$$result'
        // replace with right
        $$result = analyze([file]).then(result => {
            console.log("RESULT", result);
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

        // @example end
        return $$result;
    });
});
