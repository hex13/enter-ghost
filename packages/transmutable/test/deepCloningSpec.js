'use strict';

const assert = require('assert');
const { createExample } = require('../testUtils');

const copyDeep = require('../copyDeep');

describe('copyDeep', () => {
    //const original = createExample();
    const original = 13;
    it('should copy number', () => {
        assert.strictEqual(copyDeep(123), 123);
    });

    it('should copy string', () => {
        assert.strictEqual(copyDeep('abcdo'), 'abcdo');
    });

    it('should copy undefined', () => {
        assert.strictEqual(copyDeep(undefined), undefined);
    });

    it('should copy boolean', () => {
        assert.strictEqual(copyDeep(true), true);
        assert.strictEqual(copyDeep(false), false);
    });

    it('should copy null', () => {
        assert.strictEqual(copyDeep(null), null);
    });

    it('should clone a shallow object', () => {
        const original = {a: 123, text: 'bear'};
        const copy = copyDeep(original);
        assert.deepStrictEqual(copy, {
            a: 123,
            text: 'bear'
        });
        assert.notStrictEqual(original, copy);
    });

    it('should copy an array', () => {
        const original = [{x: 999}, 1, 10, 100, 1000]
        const copy = copyDeep(original);
        assert.deepStrictEqual(copy, original);
        assert.notStrictEqual(copy, original);
        assert.notStrictEqual(copy[0], original[0]);
    });

    it('should clone a deep object', () => {
        const original = createExample();
        const copy = copyDeep(original);
        assert.deepStrictEqual(copy, createExample());
        assert.notStrictEqual(original, copy);
        assert.notStrictEqual(original.some, copy.some);
        assert.notStrictEqual(original.some.deep, copy.some.deep);
        assert.notStrictEqual(original.some.deep.object, copy.some.deep.object);
    });

})
