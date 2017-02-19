const { parseQuery, queryWithChain, queryWithString } = require('../query');
const traverse = require('../traverse');
const assert = require('assert');
const vfs = require('vifi');

const code = `
    const o = {
        child: {
            grandchild: 1234
        },
        secondChild: 'cat'
    };
    const m = {name: require('animal')};
`;

const file = vfs.File({path: 'main.js', contents: code});

function prepare() {
    const unmount = vfs.mountFromArray([
        {path: 'animal', contents: 'module.exports = {animal: require("bear")}'},
        {path: 'bear', contents: 'module.exports = {a: "bear"}'},
    ]);

    const result = traverse([file], (from, path) => path, vfs);
    return result.then(result => {
        unmount();
        return result;
    });
}


describe('parseQuery', () => {
    it('should parse query', () => {

        const parsed = parseQuery(' . foo .  $bar .  baz 𝚿  whatever');
        assert.deepEqual(parsed, [
            {type: 'prop', name: 'foo'},
            {type: 'prop', name: '$bar'},
            {type: 'prop', name: 'baz'},
            {type: '𝚿', name: 'whatever'},
        ])
    });
});

describe('queryWithChain', () => {
    it('should get property', () => {
        return prepare().then(result => {
            const obj = result.files[0].scopes[0].vars.get('o');

            assert.strictEqual(obj.value.props.get('child').value.props.get('grandchild').value, 1234);

            assert.strictEqual(queryWithChain(obj, [
                {type: 'prop', name: 'child'},
                {type: 'prop', name: 'grandchild'},
            ]).value, 1234);

            assert.strictEqual(queryWithChain(obj, [
                {type: 'prop', name: 'secondChild'},
            ]).value, 'cat');

        });
    });

    it('should get variable', () => {
        return prepare().then(result => {
            const scope = result.files[0].scopes[0];
            const variable = scope.vars.get('o');
            assert.strictEqual(
                queryWithChain(scope, [
                    {type: 'var', name: 'o'}
                ]),
                variable
            );
        });
    });

    it('should get property from module two levels under', () => {
        return prepare().then(result => {
            const obj = result.files[0].scopes[0];
            const ref = queryWithChain(obj, [
                {type: 'var', name: 'm'},
                {type: 'prop', name: 'name'},
                {type: 'prop', name: 'animal'},
                {type: 'prop', name: 'a'}
            ], result);
            assert.strictEqual(ref.value, 'bear');
        });
    });


});


describe('queryWithString', () => {
    it('should get property', () => {
        return prepare().then(result => {
            const obj = result.files[0].scopes[0].vars.get('o');
            assert.equal(queryWithString(obj, '.child.grandchild').value, 1234);
        });
    });
    it('should get variable', () => {
        return prepare().then(result => {
            const scope = result.files[0].scopes[0];
            const variable = scope.vars.get('o');
            assert.equal(queryWithString(scope, '@o'), variable);
        });
    });

    it('should get property from variable', () => {
        return prepare().then(result => {
            const scope = result.files[0].scopes[0];
            const variable = scope.vars.get('o');
            assert.equal(queryWithString(scope, '@o.child.grandchild').value, 1234);
        });
    });

    it('should get property from module two levels under', () => {
        return prepare().then(result => {
            const obj = result.files[0].scopes[0];
            const ref = queryWithString(obj, '@m.name.animal.a', result);
//            assert.strictEqual(ref.value, 'bear');
        });
    });


});
