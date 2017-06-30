const assert = require('assert');

const { Model } = require('..');

class Example extends Model {
    $initialState() {
        return {value: 100};
    }
    foo(state, a) {
        return a + 1;
    }
    inc(state, amount) {
        state.value += amount;
    }
}


class Example2 extends Model {
    $initialState() {
        return {a: 10, b: 20, c: 'kotek'};
    }
}

class Example3 extends Model {
    $initialState() {
        return {};
    }
    get() {

    }
    getFoo() {

    }
}

class Example4 extends Model {
    $initialState(a, b, c) {
        return {a, b, c};
    }
}


let _require = require;
describe('example', () => {
    it('should work', () => {
        const require = () => _require('..');

        const { Model } = require('state-container');
        class Example extends Model {
            $initialState() {
                return {value: 100};
            }
            inc(state, amount) {
                state.value += amount;
            }
        }

        const model = new Example();
        model.$subscribe(() => {
            console.log("update your view here");
            console.log("current state:", model.state);
        });

        // notice that each call will trigger handler passed in `subscribe`
        model.inc(100);
        model.inc(200);
        assert.equal(model.state.value, 400);
        console.log("UNDO!");

        // this uses event sourcing under the hood:
        model.$undo();
        assert.equal(model.state.value, 200);

    });
});

describe('model', () => {

    it('creating Model (without inheritance) should work', () => {
        const model = new Model;
        assert.deepEqual(model.get(), {});
    });

    it('should call wrapped method and return correct result', () => {
        const model = new Example;

        assert.equal(model.foo(10), 11);
        assert.equal(model.foo(0), 1);
        assert.equal(model.foo(3), 4);
    });

    it('should trigger change handler', () => {
        const model = new Example;
        let updateCount = 0;

        model.$subscribe(() => {
            updateCount++;
        });

        model.foo();
        model.foo();
        model.foo();

        assert.equal(updateCount, 3);
    });

    it('should have return correct initial state', () => {
        const model = new Example2;
        assert.deepEqual(model.state, {a: 10, b: 20, c: 'kotek'});

        assert.deepEqual(model.get(), {a: 10, b: 20, c: 'kotek'});

        assert.deepEqual(model.get('a'), 10);
        assert.deepEqual(model.get('b'), 20);
        assert.deepEqual(model.get('c'), 'kotek');
        assert.deepEqual(model.get('toString'), undefined, 'it shouldn\'t return properties from Object.prototype');
    });

    it('should have return correct initial state (when passing args into constructor)', () => {
        const model = new Example4(10, 20, 'kotek');
        assert.deepEqual(model.state, {a: 10, b: 20, c: 'kotek'});

        assert.deepEqual(model.get(), {a: 10, b: 20, c: 'kotek'});

        assert.deepEqual(model.get('a'), 10);
        assert.deepEqual(model.get('b'), 20);
        assert.deepEqual(model.get('c'), 'kotek');
        assert.deepEqual(model.get('toString'), undefined, 'it shouldn\'t return properties from Object.prototype');
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
        model.$reset();
        assert.deepEqual(model.state, {value: 100});
    });

    it('should undo state', () => {
        const model = new Example;
        model.inc(10);
        model.inc(100);
        model.inc(1000);
        model.$undo();
        assert.deepEqual(model.state, {value: 210});

        // second undo for checking if calls are reset
        model.$undo();
        assert.deepEqual(model.state, {value: 110});
    });

    it('should dispatch via `dispatch` method', () => {
        const model = new Example;

        model.$dispatch({type: 'inc', args:[1]});

        assert.deepEqual(model.state, {value: 101});
    });

    it('should return compatibility interface and it should work', () => {
        const model = new Example;

        const store = model.$compatible();

        store.dispatch({type: 'inc', args:[3]});

        assert.deepEqual(store.getState(), {value: 103});
        assert.deepEqual(model.state, {value: 103});

    });


    it('should not trigger change handler,when $subscribe(), $compatible(), $dbg() or get.*() are called', () => {
        [
            new Example, // class with #get inherited from model
            new Example3 // class which overrides #get
        ].forEach(model => {
            let c = 0;
            model.$subscribe(() => c++);

            // some calls
            model.$subscribe(() => {});
            model.$compatible(() => {});
            model.$dbg(() => {});

            model.get();
            model.get('whatever');
            model.getFoo && model.getFoo();

            assert.equal(c, 0, `incorrect number of updates for ${model.constructor.name}`);
        });

    });
});
