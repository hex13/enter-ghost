"use strict";

const { State: Transmutable } = require('../state.js');

const { createExample } = require('../testUtils');
const { createMutation } = require('../mutations');
const { SELECTOR } = require('../symbols');
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

   xit('adds selectors to state', () => {
        const original = {
            some: {
                deep: {
                    object: {
                        abc: 123
                    }
                },
                array: [1, 2, {a: 3}],
            },
            other: {
                deep: {
                    object: {
                        def: 654
                    }
                }
            }
        };
        const store = new Transmutable(original);
        const state = store.get();
        [
            [state],
            [state.some],
            [state.some.deep],
            [state.some.deep.object],
            [state.some.array],
            [state.some.array[2]],
            [state.other],
            [state.other.deep],
            [state.other.deep.object],
        ].forEach(([obj], i) => {
            const expected = {
                store,
            };
            assert.deepStrictEqual(obj[SELECTOR], expected, `error when checking assertion (i = ${i}). Expecting ${expected} but ${obj[SELECTOR]} found`);
        });
    });

    it('allow for run scoped transform (with selector as a second argument', () => {
        expected.some.deep.object = 100;
        t.run(d => {
            d.object = 100;
        }, d => d.some.deep);
        assert.deepStrictEqual(original, createExample());
        assert.deepStrictEqual(t.get(), expected);
    });

    it('allow for select and run scoped transform (via select method)', () => {
        expected.some.deep.object = 100;
        t.select(d => d.some.deep).run(d => {
            d.object = 100;
        });
        assert.deepStrictEqual(original, createExample());
        assert.deepStrictEqual(t.get(), expected);
    });


    it('accumulates changes after run (thus allows for commiting changes incrementally)', () => {
        expected.a = 200;
        expected.b = 20;

        let thingsThatHappened = [];

        t.run(state => {
            state.a = 200;
            thingsThatHappened.push(1);
        });

        t.run(state => {
            assert.strictEqual(state.a, 200);
            state.b = 20;
            thingsThatHappened.push(2);
        });

        t.run(state => {
            assert.deepStrictEqual(state, expected)
            thingsThatHappened.push(3);
        });

        assert.deepStrictEqual(thingsThatHappened, [1, 2, 3])
    });

    // TODO consider implementing this (maybe):
    xit('allows for adding deep objects', () => {
        t.stage.allows.for.adding.deep.objects = 2;
        const copied = t.commit();
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
            t.run(state => {
                state.a = 1234;
            })

            t.run((state) => {
                state.a = 666;
            });
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

            expected.c.d = 7654;

            forked.run(state => {
                state.c.d = 7654;
            });

            assert.deepStrictEqual(expected, forked.get());
            assert.strictEqual(forked.get().c.d, 7654);

            assert.deepStrictEqual(ex, t.get(), 'changes in fork should not be present in original object');
            assert.strictEqual(t.get().c.d, 100, 'changes in fork should not be present in original object');

            t.merge(forked);

            assert.deepStrictEqual(expected, t.get(), 'changes in fork should be present in original object after merging');
            assert.strictEqual(t.get().c.d, 7654, 'changes in fork should be present in original object after merging');
        });
        it('many commits in fork (fast forward)', () => {
            const forked = t.fork();
            const oldA = createExample().a;

            expected.a = 'aaaa';
            expected.c.d = 7654;

            forked.run(state => {
                state.a = 'aaaa';
                state.c.d = 7654;
            });

            expected.a = oldA;


            forked.run(state => {
                state.a = oldA;
            });

            assert.deepStrictEqual(expected, forked.get());
            assert.strictEqual(forked.get().c.d, 7654);

            assert.deepStrictEqual(ex, t.get(), 'changes in fork should not be present in original object');
            assert.strictEqual(t.get().c.d, createExample().c.d, 'changes in fork should not be present in original object');

            t.merge(forked);

            assert.deepStrictEqual(expected, t.get(), 'changes in fork should be present in original object after merging');
            assert.strictEqual(t.get().c.d, 7654, 'changes in fork should be present in original object after merging');
        });
        it('merge with branching', () => {
            const forked = t.fork();

            expected.c.d = 7654;

            forked.run(state => {
                state.c.d = 7654;
            });


            expected.a = 333;
            t.run(state => {
                state.a = 333;
            });
            t.merge(forked);

            assert.deepStrictEqual(expected, t.get(), 'changes in fork should be present in original object after merging');
            assert.strictEqual(t.get().c.d, 7654, 'changes in fork should be present in original object after merging');
        });

        it('commit count should be appropriate in master and fork when fast forwarding', () => {
            const forked = t.fork();

            forked.run(() => {});

            t.run(() => {});

            t.merge(forked);

            assert.strictEqual(t.commits.length,2);
            assert.strictEqual(forked.commits.length, 1);
        });
        it('commit count should be appropriate in master and fork when branching', () => {
            t.run(() => {});

            const forked = t.fork();

            forked.run(() => {});

            t.run(() => {});

            t.merge(forked);
            assert.strictEqual(t.commits.length, 3);
            assert.strictEqual(forked.commits.length, 2);
        });
    })

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
            store.commit(new Commit);
            assert.strictEqual(calls.length, 1);

            const call = calls[0];
            assert.deepStrictEqual(call.store, store);

        });
    });
});
