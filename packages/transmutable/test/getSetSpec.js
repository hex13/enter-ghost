'use strict';

const { get, set } = require('../get-set');
const assert = require('assert');

// functions `get` and `set` are an implementation detail of Transmutable library
// and are tested indirectly in transmutableSpec.js

// in this file there are only some additional tests

describe('set', () => {
    it('set (deep)', () => {
        const o = {};
        set(o, ['a', 'b', 'c'], 3);
        assert.deepStrictEqual(o, {
            a: {
                b: {
                    c: 3
                }
            }
        })
    });
});
