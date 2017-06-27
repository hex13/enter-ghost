const assert = require('assert');

const { Model } = require('..');

class Example extends Model {
    constructor() {
        super({
            value: 100
        });
    }
    foo(a) {
        return a + 1;
    }
    inc(amount) {
        this.value += amount;
    }
}

describe('example', () => {
    it('should work', () => {

        class Example extends Model {
            constructor(value) {
                super({ value });
            }
            inc(amount) {
                this.value += amount;
            }
        }

        const model = new Example(100);
        model.subscribe(() => {
            console.log("update your view here");
            console.log("current state:", model.state);
        });
        model.inc(100);
        model.inc(200);
        console.log("UNDO!");
        model.undo();
    });
});

describe('model', () => {
    it('should call wrapped method and return correct result', () => {
        const model = new Example;

        assert.equal(model.foo(10), 11);
        assert.equal(model.foo(0), 1);
        assert.equal(model.foo(3), 4);
    });

    it('should trigger change handler', () => {
        const model = new Example;
        let updateCount = 0;

        model.subscribe(() => {
            updateCount++;
        });

        model.foo();
        model.foo();
        model.foo();

        assert.equal(updateCount, 3);
    });

    it('should have initial state set in constructor', () => {
        const model = new Example;
        assert.deepEqual(model.state, {value:100});
    });

    it('should mutate state', () => {
        const model = new Example;
        model.inc(10);
        model.inc(100);
        model.inc(1000);
        assert.deepEqual(model.state, {value: 1210});
    });

    it('should reset state', () => {
        const model = new Example;
        model.inc(10);
        model.inc(100);
        model.inc(1000);
        model.reset();
        assert.deepEqual(model.state, {value: 100});
    });

    it('should undo state', () => {
        const model = new Example;
        model.inc(10);
        model.inc(100);
        model.inc(1000);
        model.undo();
        assert.deepEqual(model.state, {value: 210});
    });

    xit('should not trigger change handler, when Model methods are called', () => {
        // TODO
        assert.equal('TEST CASE HAS BEEN WRITTEN', false);
    });
});
