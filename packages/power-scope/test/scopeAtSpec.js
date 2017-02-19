const { prepare, time } = require('./utilsForTests');

//
const assert = require('assert');
const scopeAt = require('../scopeAt');

describe('scopeAt', () => {
    it('should return scope at', () => {
        return prepare([
            __dirname + '/../mocks/loc.js'
        ]).then(result => {

            assert.strictEqual(
                scopeAt(result.files[0], {line: 1, column: 1}),
                result.files[0].scopes[0]
            );

            assert.strictEqual(
                scopeAt(result.files[0], {line: 3, column: 0}),
                result.files[0].scopes[1]
            );

            assert.strictEqual(
                scopeAt(result.files[0], {line: 3, column: 22}),
                result.files[0].scopes[2]
            );

            assert.strictEqual(
                scopeAt(result.files[0], {line: 4, column: 4}),
                result.files[0].scopes[2]
            );

        });
    });
});
