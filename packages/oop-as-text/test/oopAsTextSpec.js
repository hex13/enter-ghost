const oopAsText = require('..');
const assert = require('assert');


class A {
    constructor({a, b}) {
        this.a = a;
        this.b = b;
    }
    sum(a, b) {
        return a + b;
    }
    toJSON() {
        return {
            type: 'A',
            a: this.a,
            b: this.b
        };
    }
}

class B {
    constructor({v} = {}) {
        this.v = v;
    }
    toJSON() {
        return {
            type: 'B',
            v: this.v
        }
    }
}

describe('oop-as-text', () => {
    it('should serialize and deserialize', () => {
        oopAsText.register('A', A);
        oopAsText.register('B', B);

        const obj = new A({a: 3, b: new B({v:10})});
        const json = oopAsText.serialize(obj);

        assert.equal(Object.prototype.toString.call(json),'[object String]');

        const rehydrated = oopAsText.deserialize(json);
        assert(rehydrated !== obj && (rehydrated instanceof A));
        assert(rehydrated.b !== obj.b && (rehydrated.b instanceof B));
        assert.deepEqual(rehydrated, {a: 3, b:{v:10}});
        assert.equal(rehydrated.sum(10, 20), 30);
    });
});
