"use strict";

const { transmutable } = require('../transmutable.js')
const assert = require('assert');

const createExample = () => ({
    a: 2,
    b: 3,
    c: {
        d: 100
    },
    arr: [1, 2, 3],
    still: {

    },
    mutated: {
        something: 123
    }
});

describe('Transmutable', () => {

    let t, ex, expected, original;
    beforeEach(() => {
        ex = createExample();
        original = ex;
        t = transmutable().fork(ex);
        expected = createExample();
    });


    it('is in sync with the original object (after mutating original object it returns changed values)', () => {
        ex.a = 4;
        assert.strictEqual(t.stage.a, 4);

        ex.c.d = 5;
        assert.strictEqual(t.stage.c.d, 5);
    });


    it('allows for accessing properties', () => {
        assert.strictEqual(t.stage.a, 2);
        assert.deepStrictEqual(t.stage.c, {d: 100});
        assert.deepStrictEqual(t.stage.c.d, 100);
    });


    it('doesn\'t change anything without commiting', () => {
        t.stage.a = 33;
        t.stage.c.d = 922;
        // this doesn't work
        // because setters are only triggered on primitives and not on objects right now
        // t.o.c = 5543;
        t.stage.b = 5343;
        assert.deepStrictEqual(t.stage, createExample());
        assert.deepStrictEqual(ex, createExample());
    });

    it('pushes data to the object', () => {
        expected.a = 81;

        const output = createExample();
        t.stage.a = 81;
        t.pushTo(output);

        assert.deepStrictEqual(ex, createExample());
        assert.deepStrictEqual(output, expected);
    });

    it('returns a new modified object after commit() and does it in a smart way (with dirty checking)', () => {

        t.stage.mutated.something = 3;
        expected.mutated.something = 3;

        const copied = t.commit();

        assert.deepStrictEqual(copied, expected);
        assert(copied !== original);
        assert(copied.a === original.a);
        assert(copied.b === original.b);
        assert(copied.mutated !== original.mutated);
        assert(copied.still === original.still);
        assert(copied.arr === original.arr);
    });

    it('accumulates changes after commit (thus allows for commiting changes incrementally)', () => {
        expected.a = 200;
        expected.b = 20;

        t.stage.a = 200;
        t.commit();
        assert.strictEqual(t.stage.a, 200);

        t.stage.b = 20;
        const copied = t.commit();

        assert.deepStrictEqual(copied, expected)
    });

    it('allows for use arrays', () => {
        t.stage.arr.push(4);
        const copied = t.commit();

        assert.deepStrictEqual(original.arr, createExample().arr)
        assert.deepStrictEqual(copied.arr, [1, 2, 3, 4])
    });

});
