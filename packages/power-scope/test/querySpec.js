const { parseQuery, queryWithChain, queryWithString } = require('../query');
const traverse = require('../traverse');
const assert = require('assert');

const code = `
    const o = {
        child: {
            grandchild: 1234
        },
        secondChild: 'cat'
    };
`;
const file = {
    read() {
        return Promise.resolve(code);
    }
};

function prepare() {
    return traverse([file], ()=>{}, {});
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
});


describe('queryWithString', () => {
    it('should get property', () => {
        return prepare().then(result => {
            const obj = result.files[0].scopes[0].vars.get('o');
            assert.equal(queryWithString(obj, '.child.grandchild').value, 1234);
        });
    });
});
