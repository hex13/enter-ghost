### Recordable state container. It allows you to program in modern OOP and still have time travelling and other goodies.

Notice: this is an early version. Proof of concept. Not ready for production yet.

for examples of use check test cases: <https://github.com/hex13/enter-ghost/blob/master/packages/vistate/test/stateContainerSpec.js>

Breaking changes:

- no data() method in Transaction.
- transaction methods return promise

```javascript

const assert = require('assert');
const { Model } = require('vistate');


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

```
