const assert = require('assert');
const copyDeep = require('../copyDeep');
const { MUTATION } = require('../symbols');
const { createExample } = require('../testUtils');
const diff = require('../diff');


function mutation(value) {
    return {
        [MUTATION]: {
            value,
        }
    }
}

function assertSameMutation(a, b) {
    assert.deepStrictEqual(a[MUTATION], b[MUTATION]);
}

describe('diffing', () => {

    it('should compute diff between primitives', () => {
        assert.strictEqual(diff(0, 0), undefined);

        assertSameMutation(diff(0, 1), mutation(1));

        assert.strictEqual(diff(true, true), undefined);
        assert.strictEqual(diff(false, false), undefined);

        assertSameMutation(diff(true, false), mutation(false));
        assertSameMutation(diff(false, true), mutation(true));

        assert.strictEqual(diff('', ''), undefined);
        assert.strictEqual(diff('aa', 'aa'), undefined);

        assertSameMutation(diff('before', 'after'), mutation('after'));

        assertSameMutation(diff('', false), mutation(false));
        assertSameMutation(diff('', 0), mutation(0));

        assertSameMutation(diff(2, 'two'), mutation('two'));
        assertSameMutation(diff('two', 2), mutation(2));
    });

    it('should compute diff when comparing between primitives and objects', () => {
        let patch;

        patch = diff(32, {
            someValue: 1263
        });
        assertSameMutation(patch, mutation({
            someValue: 1263
        }));

        patch = diff({foo: 'bar'}, 'new value');
        assertSameMutation(patch, mutation('new value'));
    });

    it('should return undefined where shallow objects are equivalent', () => {
        const a = {x: 1, y: 20, text: 'something'};
        const b = {x: 1, y: 20, text: 'something'};
        assert.strictEqual(diff(a, b), undefined);
    });

    it('should compute diff between shallow objects with differences', () => {
        const first = {
            a: 456,
            animal: 'lion'
        };

        const second = {
            a: 456,
            animal: 'tiger'
        };
        const patch = diff(first, second);

        assert.deepStrictEqual(Object.keys(patch), ['animal']);
        assert.deepStrictEqual(patch.animal[MUTATION], {value: 'tiger'});
    });

    it('should detect new properties', () => {
        const first = {
            earth: true
        };
        const second = {
            earth: true,
            mars: true
        };
        const patch = diff(first, second);

        assert.deepStrictEqual(Object.keys(patch), ['mars']);
        assert.deepStrictEqual(Object.keys(patch.mars), []);
        assert.strictEqual(patch[MUTATION], undefined);
        assert.deepStrictEqual(patch.mars[MUTATION], {
            value: true
        });
    });

    it('should detect removed properties', () => {
        const first = {
            earth: true,
            mars: true
        };
        const second = {
            earth: true,
        };

        const patch = diff(first, second);

        assert.deepStrictEqual(Object.keys(patch), ['mars']);
        assert.deepStrictEqual(Object.keys(patch.mars), []);
        assert.strictEqual(patch[MUTATION], undefined);
        assert.deepStrictEqual(patch.mars[MUTATION], {
            value: undefined
        });

    });

    it('should compute deep diffs in deep object', () => {
        const first = createExample();
        const second = createExample();
        second.some.deep.object = 'Star Wars';
        const patch = diff(first, second);
        console.log("----", patch);
        assert.deepStrictEqual(Object.keys(patch), ['some']);
        assert.deepStrictEqual(Object.keys(patch.some), ['deep']);
        assert.deepStrictEqual(Object.keys(patch.some.deep), ['object']);
        assert.deepStrictEqual(Object.keys(patch.some.deep.object), []);

        assert.strictEqual(patch[MUTATION], undefined);
        assert.strictEqual(patch.some[MUTATION], undefined);
        assert.strictEqual(patch.some.deep[MUTATION], undefined);
        assert.deepStrictEqual(patch.some.deep.object[MUTATION], {
            value: 'Star Wars'
        });
    });

    it('should return undefined when given equivalent arrays', () => {
        assert.strictEqual(diff([], []), undefined)
        assert.strictEqual(diff([2], [2]), undefined)
        assert.strictEqual(diff([1, 2], [1, 2]), undefined)
        assert.strictEqual(diff([1, 2], [1, 2]), undefined)
        assert.strictEqual(diff([{a:3}], [{a: 3}]), undefined)
    });

    it('should compute patch for arrays of same length', () => {
        const patch = diff([1, 3], [2, 4]);
        assert.deepStrictEqual(Object.keys(patch), []);
        assert.deepStrictEqual(patch[MUTATION], {
            value: [2, 4]
        });
    });

    it('should compute patch for arrays of different length which have first n items same', () => {
        patch = diff([1, 2, 3], [5, 6]);
        assert.deepStrictEqual(Object.keys(patch), []);
        assert.deepStrictEqual(patch[MUTATION], {
            value: [5, 6]
        });
    });

    it('should compute patch for arrays of different length which have first n items same', () => {
        let patch;

        patch = diff([1, 2], [1, 2, 3]);
        assert.deepStrictEqual(Object.keys(patch), []);
        assert.deepStrictEqual(patch[MUTATION], {
            value: [1, 2, 3]
        });

        patch = diff([1, 2, 3], [1, 2]);
        assert.deepStrictEqual(Object.keys(patch), []);
        assert.deepStrictEqual(patch[MUTATION], {
            value: [1, 2]
        });

    });

})
