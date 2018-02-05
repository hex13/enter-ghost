'use strict';

const assert = require('assert');
const { createExample } = require('../testUtils');
const { transform, transformAt, over } = require('../transform');
const { ENTITY } = require('../symbols');
const symbols = require('../symbols');

// symbols
describe('symbols', () => {
    it('symbols module contains symbols', () => {
        console.log("\n---\nlogging symbols...");
        ['ENTITY', 'ENTITIES', 'MUTATION'].forEach(name => {
            assert(symbols[name], `There is no ${name} in symbols`);
            console.log(`symbols.${name} = ${String(symbols[name])} : ${typeof symbols[name]}`)
        });
        console.log("logging symbols... OK\n---\n");
    });
});

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

    it('allows for transforming - return-style', () => {
        const original = createExample();
        const expected = {
            abc: 123,
            def: {
                ghi: 'jkl'
            }
        };
        const copy = transform(d => {
            assert.deepStrictEqual(d, createExample());
            return {
                abc: 123,
                def: {
                    ghi: 'jkl'
                }
            }
        }, original);

        assert.deepStrictEqual(copy, expected);
        assert.deepStrictEqual(original, createExample());
    });


    it('exposes changes from draft inside the transformer function', () => {
        const original = createExample();
        const expected = createExample();
        const copy = transform(draft => {
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

            draft.starWars = draft.some.deep.object;
            draft.some.deep.object.y = 'Yoda';

            assert.deepStrictEqual(draft.some.deep.object.y, 'Yoda');
            assert.deepStrictEqual(draft.starWars.y, 'Yoda');
            assert.deepStrictEqual(draft.starWars, draft.some.deep.object);

        }, original);
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

    it('mutations with similar paths does not collide', () => {

        const original = createExample();
        const expected = createExample();
        expected.some.deep.object.y = 'Yoda';
        expected.some.deep.secondObject = {a: 'ooo'};
        expected.some.deep.thirdObject  = {b: 'aaa'};

        const copied = transform(state => {
            state.some.deep.secondObject = {a: 'ooo'};
            state.some.deep.object.y = 'Yoda';
            state.some.deep.thirdObject  = {b: 'aaa'};
        }, original);

        assert.deepStrictEqual(copied, expected);
    });


    it('allows for using `this`', () => {
        const original = {a: {b: 4}};

        const copied = transform(function () {
            this.a.b = 5;
        }, original);

        assert.deepStrictEqual(copied, {a:{b:5}});
    });

    it('allows for accessing properties. Accessing properties should not trigger mutations', () => {
        let passed = false;
        const original = createExample();
        const copy = transform(state => {
            assert.strictEqual(state.a, 2);
            assert.deepStrictEqual(state.c, {d: 100});
            assert.deepStrictEqual(state.c.d, 100);
            passed = true;
        }, original);
        assert.strictEqual(copy, original);
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

    it('supports currying', () => {
        const a = {x: 1};
        const b = {x: 100};
        const t = transform(state => {
            state.x++;
        });
        assert.equal(typeof t, 'function');

        const resA = t(a);
        assert.deepStrictEqual(resA, {x: 2});
        assert.deepStrictEqual(a, {x: 1});

        const resB = t(b);
        assert.deepStrictEqual(resB, {x: 101});
        assert.deepStrictEqual(b, {x: 100});
    });

    it('passes additional arguments to transformer', () => {
        const animals = {animals: 'squirrels'};
        let c = 0;
        const f = transform((state, ...args) => {
            assert.deepStrictEqual(args, [
                {type: 'FIND_FOOD', food: 'nuts'},
                'under',
                'tree'
            ]);
            c++;
        },animals, {type: 'FIND_FOOD', food: 'nuts'}, 'under', 'tree');
        assert.strictEqual(c, 1);
    })

    it('passes additional arguments to transformer (when currying)', () => {
        const animals = {animals: 'squirrels'};
        let c = 0;
        const f = transform((state, ...args) => {
            assert.deepStrictEqual(args, [
                {type: 'FIND_FOOD', food: 'nuts'},
                'under',
                'tree'
            ]);
            c++;
        });
        f(animals, {type: 'FIND_FOOD', food: 'nuts'}, 'under', 'tree');
        assert.strictEqual(c, 1);
    });

    // it's related to proxy traps `ownKeys` and `getOwnPropertyDescriptor`
    it('Object.keys and JSON.stringify reflect mutations', () => {
        const o = {a: 123};

        let ok = false;
        const copy = transform((d) => {
            assert.deepStrictEqual(Object.keys(d), ['a'])
            d.a = 21;
            d.abc = 'x';
            assert.strictEqual(JSON.stringify(d), '{"a":21,"abc":"x"}')
            assert.deepStrictEqual(Object.keys(d), ['a', 'abc'])
            ok = true;
        }, o);

        assert(ok);
    });

    it('accepts entites', () => {
        const O = () => {
            const o = {
                deep: {

                },
                [symbols.ENTITIES]: {
                    'cat': {
                        name: 'Sylvester'
                    },
                    'dog': 7854
                }
            };
            // circular entities won't work? TODO examine why.
            // o.entities.root = o;
            return o;
        };
        const o = O();

        const copy = transform((d) => {
            d.cat1 = {[ENTITY]: 'cat'};
            d.deep.cat2 = {[ENTITY]: 'cat'};

            d[symbols.ENTITIES].someNewEntity = {
                text: '!!!',
            };
            d.deep.newEntity = {[ENTITY]: 'someNewEntity'};
        }, o);

        const expected = O();
        expected[symbols.ENTITIES].someNewEntity = {text: '!!!'};
        expected.deep.cat2 = {name: 'Sylvester'};
        expected.cat1 = {
            name: 'Sylvester'
        };
        expected.deep.newEntity = {
            text: '!!!'
        };

        assert.deepStrictEqual(copy, expected);
    });
});


describe('over / transformAt', () => {
    it('allows for transforming over selector', () => {
        const original = createExample();

        const expected = createExample();
        expected.some.deep.object.y = 'Yoda';

        let copy;

        copy = transformAt(d => d.some.deep.object, d => {
            d.y = 'Yoda';
        }, original);

        assert.deepStrictEqual(copy, expected);
        assert.deepStrictEqual(original, createExample());

        copy = transformAt(['some', 'deep'], d => {
            d.object.y = 'Yoda';
        }, original);

        assert.deepStrictEqual(copy, expected);
        assert.deepStrictEqual(original, createExample());

    });

    it('allows for transforming - return-style', () => {
        const original = {
            foo: {
                bar: 123
            }
        };
        const expected = {
            foo: {
                baz: 'jkl'
            }
        };
        let copy;
        copy = transformAt(['foo'], d => {
            assert.deepStrictEqual(d, {bar: 123});
            return {baz: 'jkl'}
        }, original);

        assert.deepStrictEqual(copy, expected);
        assert.deepStrictEqual(original, {
            foo: {
                bar: 123
            }
        });

        copy = transformAt('foo', d => {
            assert.deepStrictEqual(d, {bar: 123})
            return {
                baz: 'jkl'
            };
        }, original);

        assert.deepStrictEqual(copy, expected);
        assert.deepStrictEqual(original, {
            foo: {
                bar: 123
            }
        });

    });

    it('allows for using `this`', () => {
        const original = {a: {b: 4}};

        const copied = transformAt(['a'], function () {
            this.b = 5;
        }, original);

        assert.deepStrictEqual(copied, {a:{b:5}});
    });


    it('supports currying', () => {
        const original = createExample();

        const expected = createExample();
        expected.some.deep.object.y = 'Yoda';

        let copy;
        copy = transformAt(d => d.some.deep.object, d => {
            d.y = 'Yoda';
        })(original);

        assert.deepStrictEqual(copy, expected);
        assert.deepStrictEqual(original, createExample());

        copy = transformAt(d => d.some.deep.object)(d => {
            d.y = 'Yoda';
        }, original);

        assert.deepStrictEqual(copy, expected);
        assert.deepStrictEqual(original, createExample());

    });

});
