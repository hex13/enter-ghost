'use strict';

const assert = require('assert');
const { createExample } = require('../testUtils');
const { transform } = require('../transform');

describe('transform', () => {
    it('allows for transforming', () => {
        const original = createExample();
        const expected = createExample();
        const someObject = {ooo:1};
        expected.b = 'małpy';
        expected.dupa = someObject;
        expected.c.d = 'some new value';
        expected.deep.arr[1] = 'blah';
        expected.todos[0].text = 'boo';
        expected.todos[1].user = {name: 'dog'};

        const copy = transform(state => {

            state.b = 'małpy';
            state.dupa = someObject;
            state.c.d = 'some new value';
            state.deep.arr[1] = 'blah';
            state.todos[0].text = 'boo';
            state.todos[1].user = {name: 'dog'};
        }, original);
        assert.deepStrictEqual(copy, expected);
        assert.strictEqual(copy.dupa, expected.dupa);

        assert.deepEqual(original, createExample());
    });

    const evaluateMutations = require('../evaluateMutations');

    it('exposes changes from draft inside the transformer function', () => {
        const original = createExample();
        const expected = createExample();
        transform(draft => {
            draft.a = 'what?';
            draft.c = undefined;

            assert.strictEqual(draft.a, 'what?');
            assert.strictEqual(draft.c, undefined);

            const mutated ={
                foo: {
                    bar: true
                }
            };

            draft.mutated = mutated;

            assert.strictEqual(draft.mutated, mutated);

            draft.mutated.foo = 13;
            assert.deepStrictEqual(draft.mutated, {foo: 13});
            assert.deepStrictEqual(mutated, {foo: 13});

            const added = {fish: {}};
            draft.fish = added;
            assert.deepStrictEqual(draft.fish, {fish: {}});
            added.fish.livesIn = 'water';
            assert.deepStrictEqual(draft.fish, {
                fish: {
                    livesIn: 'water'
                }
            });

        }, original)
    });

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
        const original = {arr: [1, 2, 4]};
        const copy = transform(state => {
            state.arr.push(8);
            assert.deepStrictEqual(state.arr, [1, 2, 4, 8]);
            state.arr.push(16);
            assert.deepStrictEqual(state.arr, [1, 2, 4, 8, 16]);
            state.arr.shift();
            assert.deepStrictEqual(state.arr, [2, 4, 8, 16]);
        }, original);
        assert.deepStrictEqual(original, {arr: [1, 2, 4]});
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

    it('allows for use arrays (deep) 2', () => {
        const original = {
            deep: {
                non: {x:1},
                arr: [{sth: {}}, 2]
            }
        }
        const newItem = {a: 1};
        const copy = transform((state) => {
            state.deep.arr[0].sth = 4;
        }, original)

        assert.deepStrictEqual(original.deep.arr, [{sth:{}}, 2])
        assert.deepStrictEqual(copy.deep.arr, [{sth: 4}, 2])
    });


});
