"use strict";

const { Transmutable, transform } = require('../transmutable');
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
    },
    nullable: {
      value: null
    },
    deep: {
        arr: [1, 2, 4, 8, 16]
    },
    observable: {
        foo: {
            cat: {},
            dog: {},
        }
    }
});

describe('Transmutable', () => {

    let t, ex, expected, original;
    beforeEach(() => {
        ex = createExample();
        original = ex;
        t = new Transmutable(ex);
        expected = createExample();
    });


    // this is for spec only. Transmutable assumes that you do NOT mutate your objects.
    // Mutating objects could affect all objects (because of structural sharing)
    // but this test is just for specification of library behavior (not for use case)
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

    it('reset mutations after commit', () => {
        t.stage.a = 123456;
        t.commit();
        assert.strictEqual(t.mutations.length, 0);
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

    // TODO consider implementing this (maybe):
    xit('allows for adding deep objects', () => {
        t.stage.allows.for.adding.deep.objects = 2;
        const copied = t.commit();
    });

    it('allows for use arrays (deep)', () => {
        t.stage.deep.arr.push(32);
        const copied = t.commit();

        assert.deepStrictEqual(original.deep.arr, createExample().deep.arr)
        assert.deepStrictEqual(copied.deep.arr, [1, 2, 4, 8, 16, 32])
    });


    it('allows for reify current stage', () => {
        t.stage.a = {n:2017};
        expected.a = {n:2017};
        const reified = t.reify();
        const reified2 = t.reify();

        assert.strictEqual(reified.a, reified2.a, 'and reified objects have structural sharing')
        assert.deepStrictEqual(t.mutations, [[['a'], {n: 2017}]], 'it doesn\' reset mutations after reify');

        assert.deepStrictEqual(original, createExample())
        assert.deepStrictEqual(reified, expected);
        assert.strictEqual(t.target, ex, 'target stays the same after reifying');
    });

    it('returns original object if there are no mutations', () => {
        const reified = t.reify();
        assert.strictEqual(reified, ex);
    });

    it('does not perform deep copy if a mutation doesn\'t really change value', () => {
        t.stage.a = t.stage.a;
        const reified = t.reify();
        assert.strictEqual(reified, ex);
    });

    it('can work with property that equaled null (edge case)', () => {
        t.stage.nullable.value = 25;
        expected.nullable.value = 25;
        const reified = t.reify();
        assert.deepEqual(reified, expected);
    });

    describe('observability', () => {
        it('allows for observing changes after commit (in whole object)', () => {
            let c = 0;
            t.observe(() => {
                c++;
            });
            assert.strictEqual(c, 0);
            t.commit();
            assert.strictEqual(c, 1);
            t.commit();
            assert.strictEqual(c, 2);
        });

        it('allows for attaching few observers at once', () => {
            let c1 = 0, c2 = 0;
            t.observe(() => {
                c1++;
            });
            t.observe(() => {
                c2++;
            });
            t.commit();
            assert.strictEqual(c1, 1);
            assert.strictEqual(c2, 1);
        });

        it('allows for observing changes (specific property)', () => {
            let c = 0;
            t.observe(['observable', 'foo', 'cat'], () => {
                c++;
            });
            assert.strictEqual(c, 0);
            t.stage.observable.foo.cat = 981198;
            t.commit();
            assert.strictEqual(c, 1);
        });

        it('allows for observing changes (parent observed, child changed)', () => {
            let c = 0;
            t.observe(['observable'], () => {
                c++;
            });
            assert.strictEqual(c, 0);
            t.stage.observable.foo.cat = 981198;
            t.commit();
            assert.strictEqual(c, 1);
        });

        it('allows for observing changes (child observed, parent changed)', () => {
            let c = 0;
            t.observe(['observable', 'foo', 'cat'], () => {
                c++;
            });
            assert.strictEqual(c, 0);
            t.stage.observable.foo = 981198;
            t.commit();
            assert.strictEqual(c, 1);
        });

        it('it triggers handler at most one after one commit (even if there are many mutations)', () => {
            let c = 0;
            t.observe(['observable', 'foo', 'cat'], () => {
                c++;
            });
            t.stage.observable.foo.cat = 981198;
            t.stage.observable.foo.cat = 282272;
            t.commit();
            assert.strictEqual(c, 1);
        });


        it('doesn\'t trigger observer if there is no matching mutation', () => {
            let c = 0;
            t.observe(['observable', 'foo', 'cat'], () => {
                c++;
            });
            t.stage.observable.foo.dog = 1234;
            t.commit();
            assert.strictEqual(c, 0);
        });
    });

    describe('(forking and merging)', () => {
        it('.fork() creates new transmutable object with same target', () => {
            const forked = t.fork();
            assert(forked instanceof Transmutable);
            assert.notStrictEqual(t, forked);
            assert.strictEqual(forked.target, t.target);
            assert.notStrictEqual(forked.commits, t.commits, 'fork and master mustn\'t have same commits object');
            assert.deepStrictEqual(forked.commits, t.commits, 'fork and master should have equivalent commits objects');
        });
        it('forked should have the same commits', () => {
            t.stage.a = 1234;
            t.commit();
            t.stage.a = 666;
            t.commit();
            const forked = t.fork();
            assert.notStrictEqual(forked.commits, t.commits);
            assert.deepStrictEqual(forked.commits, t.commits);
        });
        const testDesc = (
            'it\'s possible:\n' +
            '1. to fork\n' +
            '2. to commit changes in fork\n' +
            '3. to merge changes into original object)' +
            ''
        );
        it(testDesc, () => {
            const forked = t.fork();
            forked.stage.c.d = 7654;
            expected.c.d = 7654;

            forked.commit();

            assert.deepStrictEqual(expected, forked.reify());
            assert.strictEqual(forked.stage.c.d, 7654);

            assert.deepStrictEqual(ex, t.reify(), 'changes in fork should not be present in original object');
            assert.strictEqual(t.stage.c.d, 100, 'changes in fork should not be present in original object');

            t.merge(forked);

            assert.deepStrictEqual(expected, t.reify(), 'changes in fork should be present in original object after merging');
            assert.strictEqual(t.stage.c.d, 7654, 'changes in fork should be present in original object after merging');
        });
        it('many commits in fork (fast forward)', () => {
            const forked = t.fork();
            const oldA = createExample().a;

            forked.stage.a = 'aaaa';
            forked.stage.c.d = 7654;
            expected.a = 'aaaa';
            expected.c.d = 7654;

            forked.commit();

            expected.a = oldA;
            forked.stage.a = oldA;

            forked.commit();

            assert.deepStrictEqual(expected, forked.reify());
            assert.strictEqual(forked.stage.c.d, 7654);

            assert.deepStrictEqual(ex, t.reify(), 'changes in fork should not be present in original object');
            assert.strictEqual(t.stage.c.d, createExample().c.d, 'changes in fork should not be present in original object');

            t.merge(forked);

            assert.deepStrictEqual(expected, t.reify(), 'changes in fork should be present in original object after merging');
            assert.strictEqual(t.stage.c.d, 7654, 'changes in fork should be present in original object after merging');
        });
        it('merge with branching', () => {
            const forked = t.fork();
            forked.stage.c.d = 7654;
            expected.c.d = 7654;

            forked.commit();

            t.stage.a = 333;
            expected.a = 333;
            t.commit();
            t.merge(forked);

            assert.deepStrictEqual(expected, t.reify(), 'changes in fork should be present in original object after merging');
            assert.strictEqual(t.stage.c.d, 7654, 'changes in fork should be present in original object after merging');
        });

        it('commit count should be appropriate in master and fork when fast forwarding', () => {
            const forked = t.fork();

            forked.stage.c.d = 7654;
            forked.commit();

            t.stage.a = 333;
            t.commit();

            t.merge(forked);

            assert.strictEqual(t.commits.length,2);
            assert.strictEqual(forked.commits.length, 1);
        });
        it('commit count should be appropriate in master and fork when branching', () => {
            t.stage.a = 2222;
            t.commit();

            const forked = t.fork();

            forked.stage.c.d = 7654;
            forked.commit();

            t.stage.a = 333;
            t.commit();

            t.merge(forked);
            assert.strictEqual(t.commits.length, 3);
            assert.strictEqual(forked.commits.length, 2);
        });
    })

});

describe('transform', () => {
    it('allows for transforming', () => {
        const original = createExample();
        const expected = createExample();
        const someObject = {ooo:1};
        expected.b = 'małpy';
        expected.dupa = someObject;
        const copy = transform(original, state => {
            state.b = 'małpy';
            state.dupa = someObject;
        });
        assert.deepEqual(copy, expected);
        assert.strictEqual(copy.dupa, expected.dupa);
        assert.strictEqual(copy.c, original.c);

        assert.deepEqual(original, createExample());
    });
});
