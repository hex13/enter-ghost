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
    it('get with [] as path should return original object', () => {
        const o = {};
        assert.strictEqual(get(o, []), o);
    });
    it('get without path should return original object', () => {
        const o = {};
        assert.strictEqual(get(o), o);
    });

    it('get with function as path should call function as getter', () => {
        const o = {
            abc: {
                foo: {

                },
                bar: {
                    here: 'you are!'
                }
            }
        };
        assert.strictEqual(get(o, d => d.abc.bar.here), 'you are!');
    });
});
