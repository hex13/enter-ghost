'use strict';

// Here are additional tests of current patching algorithm.
// They are implementation specific so if algorithm or implementation changes,
// these tests may need to be changed or deleted.

// Patching algorithm will still be covered (via `transform` function)
// but having an additional separate suite can help with debugging.

const assert = require('assert');
const { createExample } = require('../testUtils');
const { transform, applyPatch } = require('../transform');
const { MUTATION, WAS_ACCESSED } = require('../symbols');

describe('applyPatch', () => {
    let original;
    beforeEach(() => {
        original = createExample();
    });

    it('replaces whole object with a value', () => {
        const clone = applyPatch(original, {
            [MUTATION]: {value: 1234}
        });
        assert.strictEqual(clone, 1234);
    });

    it('returns original where there is no patch', () => {
        const clone = applyPatch(original);
        assert.strictEqual(clone, original);
    });

    it('returns original where there is an empty patch', () => {
        const clone = applyPatch(original, {});
        assert.strictEqual(clone, original);
    });

    it('patches shallow property', () => {
        const clone = applyPatch({a: 123}, {
            [WAS_ACCESSED]: true,
            a: {
                [WAS_ACCESSED]: true,
                [MUTATION]: {value: 456}
            }
        });
        assert.deepStrictEqual(clone, {a: 456});
    });

    xit('patches deep property', () => {
        const clone = applyPatch({
            a: 123,
            deep: {
                deeper: {
                }
            }
        }, {
            deep: {
                deeper: {
                    deepest: {
                        [MUTATION]: {value: 'cat'}
                    }
                }
            }
        });
        assert.deepStrictEqual(clone, {
            a: 123,
            deep: {
                deeper: {
                    deepest: 'cat'
                }
            }
        });
    });

    it(`
            patches when property name equals "undefined" (exactly like written, i.e. string which reads "undefined"). This is an edge case.
            E.g. this could happen if MUTATION key was undefined, it would convert to "undefined" string and mess with such property.
        `, () => {
        const clone = applyPatch({undefined: 123}, {
            [WAS_ACCESSED]: true,
            undefined: {
                [WAS_ACCESSED]: true,
                [MUTATION]: {value: 1234}
            }
        });
        assert.deepStrictEqual(clone, {undefined: 1234});
    });



});
