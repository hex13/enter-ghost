"use strict";

const assert = require('assert');
const { expect } = require('chai');

const { Model, createEvent, ROOT_LOCAL_ID } = require('..');
const sc = require('..');

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

class Example5 extends Model {
    $initialState() {
        return {
            status: 'normal',
            text: ''
        };
    }
    setText(state, text) {
        state.text = text;
    }
}

class Example6 extends Model {
    gummibear() {

    }
    smurf() {

    }
    yogibear() {

    }
    sylvester() {

    }
    cinderella() {

    }
}

class Example7 extends Model {
    someAction() {

    }
    $initialState() {
        class Child extends Model {
            $initialState() {
                class GrandChild extends Model {
                    $initialState() {
                        return {y: 100};
                    }
                    bar(state, y) {
                        state.y = y;
                    }
                }
                return {x: 10, grandChild: new GrandChild};
            }
            foo(state, x) {
                state.x = x;
            }
        }
        return {
            child: new Child
        };
    }
}

const Hierarchy = Example7;

class Example8 extends Model {
    _privateMethod() {

    }
}

function pseudoAjax() {
    return Promise.resolve('Nevermore');
}

let _require = require;

describe('factory', () => {
    it('should create models and assign unique ids (for 1000 objects)', () => {
        const ids = new Set;
        for (let i = 0; i < 1000; i++) {
            const model = sc.create(Example4, 10, 20, 'kotek');
            assert(model instanceof Example4);
            assert.deepEqual(model.get(), {a: 10, b: 20, c: 'kotek'});
            const id = model.$id();
            assert(!ids.has(id));
            ids.add(id);
        }
    });
});


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
    describe('events', () => {
        it('it should record events and expose them via $events', () => {
            const model = new Example;
            model.inc(10);
            model.foo('a', {a: 4});
            expect(model.$events()).deep.equal([
                createEvent(model, 'inc', [10]),
                createEvent(model, 'foo', ['a', {a: 4}]),
            ]);
        });
        it('it should record events and expose them via $events (models in hierarchy). Root should gather all events', () => {
            const model = new Hierarchy;
            const child = model.get('child');
            const grandChild = child.get('grandChild');

            model.someAction('a');
            child.foo(1);
            grandChild.bar(3);

            expect(grandChild.$events()).deep.equal([
                createEvent(grandChild, 'bar', [3])
            ]);

            expect(child.$events()).deep.equal([
                createEvent(child, 'foo', [1])
            ]);

            expect(model.$events()).deep.equal([
                createEvent(model, 'someAction', ['a']),
                createEvent(child, 'foo', [1]),
                createEvent(grandChild, 'bar', [3]),
            ]);

        });
    });

    describe('hierarchy', () => {
        it('should assign local ids', () => {
            const root = new Hierarchy;
            expect(root.$localId()).equal(ROOT_LOCAL_ID);
            expect(root.get('child').$localId()).equal(ROOT_LOCAL_ID + 1);
            expect(root.get('child').get('grandChild').$localId()).equal(ROOT_LOCAL_ID + 2);
        });

        it('should allow for undo whole hierarchy', () => {
            const root = new Hierarchy;
            root.get('child').foo(200);
            expect(root.get('child').get('x')).equal(200);
            root.get('child').foo(300);
            expect(root.get('child').get('x')).equal(300);

            root.$undo();
            expect(root.get('child').get('x')).equal(200);
        });

        it('should create children and children should notify parent about updates', () => {
            const root = new Hierarchy;
            let c = 0;
            assert.deepEqual(root.get('child').get('x'), 10);


            root.$subscribe((model) => {
                c++;
                assert.strictEqual(model, root.get('child'));
            });
            root.get('child').foo(13);
            assert.equal(root.get('child').get('x'), 13);
            assert.equal(c, 1);
        });
        it('should create children and grand children connected to hierarchy. $root should return root model', () => {
            const root = new Hierarchy;
            assert.strictEqual(root.$root(), root);
            assert.strictEqual(root.get('child').$root(), root);
            assert.strictEqual(root.get('child').get('grandChild').$root(), root);
        });
        it('should create grand children and grand children should notify parents and grand parents about updates', () => {
            const root = new Hierarchy;
            let c = 0;
            let d = 0;
            assert.deepEqual(root.get('child').get('grandChild').get('y'), 100);
            root.$subscribe((model) => {
                assert.strictEqual(model, root.get('child').get('grandChild'));
                c++;
            });
            root.get('child').$subscribe((model) => {
                assert.strictEqual(model, root.get('child').get('grandChild'));
                d++;
            });

            root.get('child').get('grandChild').bar(101);
            assert.deepEqual(root.get('child').get('grandChild').get('y'), 101);
            assert.equal(c, 1);
            assert.equal(d, 1);
        });
    });

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
            new Example3, // class which overrides #get
            new Example8, // class with private method
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
            model._privateMethod && model._privateMethod();

            let expected = 0;
            assert.equal(c, expected, `incorrect number of updates for ${model.constructor.name}. It should be ${expected} but is ${c}`);
        });

    });

    it('should handle transactions', () => {
        const model = new Example5;

        return model.$transaction((transaction, aModel) => {
            return pseudoAjax().then(text => {
                // API proposal (to encapsulate temp state in transaction handler):
                //transaction.set({status: 'loading', a: 1})

                assert.equal(model.get('status'), 'loading');
                assert.equal(model.get('a'), 1);

                aModel.setText(text);
                assert.equal(model.get('text'), 'Nevermore');

                transaction.end();
            });
        }, {status: 'loading', a:1}).then((a) => {
            assert.equal(model.get('status'), 'normal');
            assert.equal(model.get('a'), undefined);

            assert.equal(model.get('text'), 'Nevermore');
        });
    });

    it('should assign ending state in transactions', () => {
        const model = new Example5;

        model.$transaction((transaction, aModel) => {
            transaction.end({status: 'error'});
        }, {status: 'loading', a:1});

        assert.equal(model.get('status'), 'error');
        assert.equal(model.get('a'), undefined);
    });

    // TODO remove autocorrection logic out of this package
    it('should return autocorrect suggestion', () => {
        const model = new Example6;
        assert.equal(model.$autocorrect('gumbuear'), 'gummibear');
        assert.equal(model.$autocorrect('cynDerela'), 'cinderella');
        assert.equal(model.$autocorrect('Sylsveer'), 'sylvester');
        assert.equal(model.$autocorrect('yobuear'), 'yogibear');
        assert.equal(model.$autocorrect('smrf'), 'smurf');

        assert.equal(model.$autocorrect('mmbear'), 'gummibear');
        assert.equal(model.$autocorrect('ynDerelax'), 'cinderella');
        assert.equal(model.$autocorrect('ylsveers'), 'sylvester');
        assert.equal(model.$autocorrect('obuear'), 'yogibear');
        assert.equal(model.$autocorrect('mrf'), 'smurf');
    });

});
