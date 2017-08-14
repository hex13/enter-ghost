const { serialize, deserialize } = require('..');
const assert = require('assert');

const createExampleA = () => ({
    a: 2
});

describe('Serialeasy', () => {
    describe('serializes object', () => {
        it('with number property', () => {
            const o = {a: 2};
            assert.deepStrictEqual(serialize(o), [
                ["a", 2]
            ])
        });
        it('with string property', () => {
            const o = {s: "Hello"};
            assert.deepStrictEqual(serialize(o), [
                ["s", "Hello"]
            ])
        });
        it('with multiple keys (alphabetic sorting)', () => {
            const o = {s: "Hello", a: 99, n: 20};
            assert.deepStrictEqual(serialize(o), [
                ["a", 99],
                ["n", 20],
                ["s", "Hello"],
            ])
        });
        it('with nesting', () => {
            const o = {
                prop: 123,
                subObject: {
                    a: 1,
                    c: "three",
                    b: 2,
                }
            };
            assert.deepStrictEqual(serialize(o), [
                ["prop", 123],
                [
                    "subObject",
                    [
                        ["a", 1],
                        ["b", 2],
                        ["c", "three"],
                    ]
                ],
            ]);
        });
    });

    describe('deserializes object', () => {
        it('with number property', () => {
            const data = [["a", 81]];
            assert.deepStrictEqual(deserialize(data), {a: 81});
        });
        it('with string property', () => {
            const data = [["b", "tekst"]];
            assert.deepStrictEqual(deserialize(data), {b: 'tekst'});
        });
        it('with multiple keys', () => {
            const data = [["a", "tekst"], ["b", 3]];
            assert.deepStrictEqual(deserialize(data), {
                a: "tekst",
                b: 3
            });
        });
        it('with nesting', () => {
            const data = [
                ["o", 2],
                [
                    "sub",
                    [
                        ["p", 2],
                        ["r", "abc"]
                    ]
                ]
            ];
            assert.deepStrictEqual(deserialize(data), {
                o: 2,
                sub: {
                    p: 2,
                    r: "abc"
                }
            });
        });
    });

    it('serializes and deserializes to the equal object', () => {
        const o = {
            a: 90,
            b: "a",
            c: {
                d: {
                    e: 120
                }
            }
        };
        assert.deepStrictEqual(deserialize(serialize(o)), o);
    });
});
