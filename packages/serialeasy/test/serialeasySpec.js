'use strict';

const { serialize, deserialize } = require('..');
const assert = require('assert');

const createComplexObject = () => ({
    a: 90,
    b: "a",
    c: {
        d: {
            e: 120,
            f: [10, 20, [1, {f: 2}]]
        }
    },
});

describe('Serialeasy', () => {
    describe('serialization', () => {
        it('of number', () => {
            assert.strictEqual(serialize(30), 30);
        });
        it('of string', () => {
            assert.strictEqual(serialize('squirrel'), 'squirrel');
        });
        describe('of array', () => {
            it('with numbers and strings', () => {
                assert.deepStrictEqual(serialize([1, 2, 4, "eight"]), ["arr", [1, 2, 4, "eight"]]);
            });
            it('nested arrays', () => {
                assert.deepStrictEqual(serialize([1, 2, 4, [16, 32]]), [
                    "arr", [
                        1, 2, 4, [
                            "arr",
                            [16, 32]
                        ]
                    ]
                ]);
            });
            it('with object as an item', () => {
                assert.deepStrictEqual(
                    serialize([100, {monkey: 'banana'}]),
                    ["arr", [
                        100, [["monkey", "banana"]]
                    ]]
                )
            });
        });

        describe('serializes object', () => {
            it('with array property', () => {
                const o = {numbers: [1, 10, 100, "thousand"]};
                assert.deepStrictEqual(serialize(o), [
                    ["numbers", ["arr", [1, 10,100, "thousand"]]]
                ]);
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
        it('with predefined values', () => {
            const foo = {};
            const o = {a: 3, b: "hello", c: 20, d: "world", ref: foo};
            const preset = {
                values: {
                    "H": "hello",
                    "twenty": 20,
                    "foo": foo
                }
            }
            assert.deepStrictEqual(serialize(o, preset), [
                ["a", 3],
                ["b", ["val", "H"]],
                ["c", ["val", "twenty"]],
                ["d", "world"],
                ["ref", ["val", "foo"]]
            ])
        });
    });


    describe('deserialization', () => {
        it('of number', () => {
            assert.strictEqual(deserialize(3), 3);
        });
        it('of string', () => {
            assert.strictEqual(deserialize('house'), 'house');
        });
        it('of array', () => {
            assert.deepStrictEqual(deserialize(["arr", [90, 89]]), [90, 89]);
        });
        it('of nested array', () => {
            assert.deepStrictEqual(deserialize([
                "arr", [
                    90, 89, [
                        "arr", [
                            88, 87, [
                                "arr", [86, 85, 84]
                            ]
                        ]
                    ]
                ]
            ]), [90, 89, [88, 87, [86, 85, 84]]]);
        });
        it('of array with object as an item', () => {
            assert.deepStrictEqual(deserialize(
                [
                    "arr", [
                        9, [["tree", "elm"]]
                    ]
                ]
            ), [9, {tree: 'elm'}]);
        });

        describe('deserializes object', () => {
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
    });

    it('serializes and deserializes to the equal object', () => {
        const o = createComplexObject();
        assert.deepStrictEqual(deserialize(serialize(o)), o);
    });
    it('serializes and deserializes to the equivalent object (after stringify/parse)', () => {
        const o = createComplexObject();
        const stringified = JSON.stringify(serialize(o));
        assert.deepStrictEqual(deserialize(JSON.parse(stringified)), o);
    });

});
