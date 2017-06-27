const oopAsText = require('..');
const assert = require('assert');


class A {
    constructor({a}) {
        this.a = a;
    }
    sum(a, b) {
        return a + b;
    }
    toJSON() {
        return {
            type: 'A',
            a: this.a
        };
    }
}

class B {
}

describe('oop-as-text', () => {
    it('should serialize and deserialize', () => {
        oopAsText.register('A', A);
        oopAsText.register('B', B);

        const obj = new A({a: 3});
        const json = oopAsText.serialize(obj);

        assert.equal(Object.prototype.toString.call(json),'[object String]');

        const rehydrated = oopAsText.deserialize(json);

        assert(rehydrated instanceof A);
        assert.deepEqual(rehydrated, {a: 3});
        assert.equal(rehydrated.sum(10, 20), 30);
    });
});
