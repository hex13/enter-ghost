"use strict";

const { Transmutable, transform} = require('../transmutable.js');
const { Transform } = require('../transform.js');
const { applyChanges } = require('../cloning');
const { createExample } = require('../testUtils');
const { createMutation } = require('../mutations');

const Commit = require('../commit');
const assert = require('assert');

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


    // TODO review this case (mutations vs changes)
    it('apply mutations to the object', () => {
        expected.a = 81;

        const output = createExample();
        t.stage.a = 81;
        applyChanges(output, t.nextCommit.mutations);

        assert.deepStrictEqual(ex, createExample());
        assert.deepStrictEqual(output, expected);
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

    // TODO consider implementing this (maybe):
    xit('allows for adding deep objects', () => {
        t.stage.allows.for.adding.deep.objects = 2;
        const copied = t.commit();
    });

    it('allows for reify current stage', () => {
        t.stage.a = {n:2017};
        expected.a = {n:2017};
        const reified = t.reify();
        const reified2 = t.reify();

        assert.strictEqual(reified.a, reified2.a, 'and reified objects have structural sharing')

        assert.deepStrictEqual(t.nextCommit.mutations, [createMutation(['a'], {n: 2017})], 'it doesn\' reset mutations after reify');

        assert.deepStrictEqual(original, createExample())
        assert.deepStrictEqual(reified, expected);
        assert.strictEqual(t.target, ex, 'target stays the same after reifying');
    });

    it('returns original object if there are no mutations', () => {
        const reified = t.reify();
        assert.strictEqual(reified, ex);
    });

    describe('actions', () => {
        it('performs mutations', () => {
            const handler = (state) => {
                state.a = 13;
                state.c.d = 1029;
            };

            expected.a = 13;
            expected.c.d = 1029;
            assert.deepStrictEqual(t.run(handler), expected);
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
    describe('(events)', () => {
        it('`lastCommit` has correct number of mutations', () => {
            assert.strictEqual(t.lastCommit.mutations.length, 0);
            t.stage.a = 9182;
            assert.strictEqual(t.lastCommit.mutations.length, 0);
            t.stage.b = 9182;
            assert.strictEqual(t.lastCommit.mutations.length, 0);
            t.stage.c = 9182;
            assert.strictEqual(t.lastCommit.mutations.length, 0);
            t.commit();
            assert.strictEqual(t.lastCommit.mutations.length, 3);
        });
        it('`put` allows for putting events', () => {
            const e = {type: 'foo124'};
            t.nextCommit.put(e);
            t.commit();
            assert.deepStrictEqual(t.lastCommit.events, [{
                type: 'foo124'
            }]);
        });
        it('events are reset after commit', () => {
            t.nextCommit.put({type: 'bar124'});
            t.commit();
            t.nextCommit.put({type: 'bar123'});
            t.commit();
            assert.deepStrictEqual(t.lastCommit.events, [{
                type: 'bar123'
            }]);
        });
    });

    describe('(hooks)', () => {
        it('calls onCommit after commit', () => {
            const calls = [];
            const store = new Transmutable({}, {
                onCommit(store, commit) {
                    calls.push({
                        store, commit
                    });
                }
            });
            assert.strictEqual(calls.length, 0);
            store.commit();
            assert.strictEqual(calls.length, 1);

            const call = calls[0];
            assert.deepStrictEqual(call.store, store);
            assert(call.commit instanceof Commit);
        });
    });
});

describe('transform', () => {
    it('allows for transforming', () => {
        const original = createExample();
        const expected = createExample();
        const someObject = {ooo:1};
        expected.b = 'małpy';
        expected.dupa = someObject;
        const copy = transform(state => {
            state.b = 'małpy';
            state.dupa = someObject;
        }, original);
        assert.deepEqual(copy, expected);
        assert.strictEqual(copy.dupa, expected.dupa);
        assert.strictEqual(copy.c, original.c);

        assert.deepEqual(original, createExample());
    });

    const evaluateMutations = require('../evaluateMutations');

    xit('creates proper mutations when double pushing arrays', () => {
        const o = {arr: [1, 2, 4]};
        const mutations = evaluateMutations(state => {
            state.arr.push(8);
            state.arr.push(16);
        }, o);

        assert.deepStrictEqual(mutations, [
            createMutation(['arr'], undefined, 'push', [8]),
            createMutation(['arr'], undefined, 'push', [16]),
        ])
    });

    xit('creates proper mutations when mapping', () => {
        const o = {arr: [1, 2, 4]};
        const mutations = evaluateMutations(state => {
            state.arr.map(x => x * 2);
        }, o);

        assert.deepStrictEqual(mutations,)
    });

    it('allows for double pushing array and then shift', () => {
        const o = {arr: [1, 2, 4]};
        const copy = transform(state => {
            state.arr.push(8);
            state.arr.push(16);
            state.arr.shift();
        }, o);
        assert.deepStrictEqual(copy, {arr: [2, 4, 8, 16]})
    });

    it('allows for mapping', () => {
        const o = {arr: [1, 2, 4]};
        const mutations = transform(state => {
            const decoy = state.arr.map(x => x * 10);
            state.arr = state.arr.map(x => x * 2);
            const decoy2 = state.arr.map(x => x * 11);
        }, o);
        console.log(mutations)
        assert.deepStrictEqual(mutations, {
            arr: [2, 4, 8]
        })
    });

    it('allows for filtering', () => {
        const o = {arr: [1, 2, 4, 6, 8, 9, 10, 12, 13, 14]};
        const mutations = transform(state => {
            const decoy = state.arr.map(x => x * 10);
            state.arr = state.arr.filter(x => x % 2 == 0);
            const decoy2 = state.arr.filter(x => x == 4);
        }, o);
        console.log(mutations)
        assert.deepStrictEqual(mutations, {
            arr: [2, 4, 6, 8, 10, 12, 14]
        })
    });

    it('returns a new modified object and does it in a smart way (with dirty checking)', () => {

        const original = createExample();
        const expected = createExample();
        expected.mutated.something = 3;

        const copied = transform(state => {
            state.mutated.something = 3;
        }, original);

        assert.deepStrictEqual(copied, expected);
        assert(copied !== original);
        assert(copied.a === original.a);
        assert(copied.b === original.b);
        assert(copied.mutated !== original.mutated);
        assert(copied.still === original.still);
        assert(copied.arr === original.arr);
    });

    it('allows for accessing properties', () => {
        let passed = false;
        transform(state => {
            assert.strictEqual(state.a, 2);
            assert.deepStrictEqual(state.c, {d: 100});
            assert.deepStrictEqual(state.c.d, 100);
            passed = true;
        }, createExample());
        assert(passed);
    });


    it('can work with property that equaled null (edge case)', () => {
        const expected = createExample();
        expected.nullable.value = 25;

        const copy = transform(state => {
            state.nullable.value = 25;
        }, createExample());

        assert.deepEqual(copy, expected);
    });

    it('allows for use arrays', () => {
        const original = createExample();
        const copy = transform(state => {
            state.arr.push(4);
        }, original)

        assert.deepStrictEqual(original.arr, createExample().arr)
        assert.deepStrictEqual(copy.arr, [1, 2, 3, 4])
    });

    it('does not perform deep copy if a mutation doesn\'t really change value', () => {
        const original = createExample();

        const copy = transform(state => {
            state.a = state.a;
        }, original)
        assert.strictEqual(original, copy);
    });

    it('allows for use arrays (deep)', () => {
        const original = createExample();
        const copy = transform((state) => {
            state.deep.arr.push(32);
        }, original)

        assert.deepStrictEqual(original.deep.arr, createExample().deep.arr)
        assert.deepStrictEqual(copy.deep.arr, [1, 2, 4, 8, 16, 32])
    });

});
