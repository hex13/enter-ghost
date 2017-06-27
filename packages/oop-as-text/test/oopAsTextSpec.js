const oopAsText = require('..');
const assert = require('assert');

describe('', () => {
    it('should serialize', () => {
        const json = oopAsText.serialize({a: 3});
        assert.equal(Object.prototype.toString.call(json),'[object String]');
        const rehydrated = oopAsText.deserialize(json);
        assert.deepEqual(rehydrated, {a: 3});
    });
});

