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
        // TODO change to state as argument, instead of this
        state.value += amount;
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


    xit('should not trigger change handler, when Model methods are called', () => {
        // TODO
        assert.equal('TEST CASE HAS BEEN WRITTEN', false);
    });
});
