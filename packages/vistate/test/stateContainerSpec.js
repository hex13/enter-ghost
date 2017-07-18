"use strict";

const FRAMEWORK = 'vistate';
const assert = require('assert');

const { expect } = require('chai');

const { Model, createEvent, ROOT_LOCAL_ID, reducerMiddleware, Transaction } = require('..');
const sc = require('..');
const api = sc.vistate;
function $undo(model) {
    return api.undo(model);
}
function $events(model) {
    return api.events(model);
}

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

class SubclassedModel extends Model {

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

class TransactionExampleModel extends Model {
    $initialState() {
        return {
            status: 'normal',
            text: '',
            category: 'none',
        };
    }
    setText(state, text) {
        state.text = text;
    }
    setCategory(state, category) {
        state.category = category;
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

class ReducerModel extends Model {
    $initialState() {
        return {value: 100};
    }
    inc(state, amount) {
        return {
            value: state.value + amount
        }
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
        $undo(model);
        assert.equal(model.state.value, 200);

    });
});

describe('model', () => {
    describe('events', () => {
        it(`it should record events and expose them via ${FRAMEWORK}.events()`, () => {
            const model = new Example;
            model.inc(10);
            model.foo('a', {a: 4});
            expect($events(model)).deep.equal([
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

            expect($events(grandChild)).deep.equal([
                createEvent(grandChild, 'bar', [3])
            ]);

            expect($events(child)).deep.equal([
                createEvent(child, 'foo', [1])
            ]);

            expect($events(model)).deep.equal([
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

        it('should call $afterChildAction on root', () => {
            const root = new Hierarchy;
            let actions = [];
            root.$afterChildAction = function (model, name) {
                actions.push([model.constructor.name, name])
            }
            root.get('child').foo();
            root.get('child').get('grandChild').bar();
            expect(actions).deep.equal([
                ['Child', 'foo'],
                ['GrandChild', 'bar'],
            ]);
        });

        it('should allow for undo whole hierarchy', () => {
            const root = new Hierarchy;
            root.get('child').foo(200);
            expect(root.get('child').get('x')).equal(200);
            root.get('child').foo(300);
            expect(root.get('child').get('x')).equal(300);

            $undo(root);
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
        it('should create grand children and grand children should notify root about updates', () => {
            const root = new Hierarchy;
            let rootUpdates = 0;
            let childUpdates = 0;
            let grandChildUpdates = 0;
            assert.deepEqual(root.get('child').get('grandChild').get('y'), 100);

            root.$subscribe((model) => {
                assert.strictEqual(model, root.get('child').get('grandChild'));
                rootUpdates++;
            });
            root.get('child').$subscribe((model) => {
                assert.strictEqual(model, root.get('child').get('grandChild'));
                childUpdates++;
            });
            root.get('child').get('grandChild').$subscribe((model) => {
                assert.strictEqual(model, root.get('child').get('grandChild'));
                grandChildUpdates++;
            });
            root.get('child').get('grandChild').bar(101);

            assert.deepEqual(root.get('child').get('grandChild').get('y'), 101);
            assert.equal(rootUpdates , 1);
            assert.equal(childUpdates, 0);
            assert.equal(grandChildUpdates, 1);
        });
        it('undo should generate one update', () => {
            // FIXME
            // commented asserts mean that they are needed but they are skipped
            const root = new Hierarchy;
            let rootUpdates = 0;
            let childUpdates = 0;
            let grandChildUpdates = 0;

            root.get('child').get('grandChild').bar(101);
            root.get('child').get('grandChild').bar(101);
            root.get('child').get('grandChild').bar(101);


            root.$subscribe((model) => {
                //assert.strictEqual(model, root.get('child').get('grandChild'));
                rootUpdates++;
            });
            root.get('child').$subscribe((model) => {
                assert.strictEqual(model, root.get('child').get('grandChild'));
                childUpdates++;
            });
            root.get('child').get('grandChild').$subscribe((model) => {
                assert.strictEqual(model, root.get('child').get('grandChild'));
                grandChildUpdates++;
            });
            $undo(root);

            assert.deepEqual(root.get('child').get('grandChild').get('y'), 101);
            assert.equal(rootUpdates , 1);
            // assert.equal(childUpdates, 0);
            // assert.equal(grandChildUpdates, 1);

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

    it('should trigger change handler after each action', () => {
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

    it('should use processResult middleware', () => {
        const model = new Example;
        let c = 0;
        model.$use({
            processResult: () => {c++}
        })
        model.foo();
        model.foo();
        model.foo();
        model.foo();
        assert.strictEqual(c, 4);
    });

    it('should mutate state (using reducerMiddleware)', () => {
        const model = new ReducerModel;
        let c = 0;
        model.$use(reducerMiddleware);
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
        $undo(model);
        assert.deepEqual(model.state, {value: 210});

        // second undo for checking if calls are reset
        $undo(model);
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
        const model = new TransactionExampleModel;

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

    it('it should be possible to set state properties via set()', () => {
        [new Model, new SubclassedModel].forEach(model => {
            model.set('a', 10);
            model.set('b', 20);
            model.set('c', 'kotek');
            model.set('a', 30);
            model.set('d', {
                e: 123
            })

            expect(model.get()).deep.equal({
                a: 30,
                b: 20,
                c: 'kotek',
                d: {
                    e: 123
                }
            });
        })
    })

    describe('Transaction', () => {
        it('should allow for define tasks and commiting them', () => {
            const transaction = new Transaction();
            const model = new TransactionExampleModel;
            transaction.task(() => {
                model.setText('koteł');
            });
            transaction.task(() => {
                model.setCategory('zwierzę');
            });
            expect(model.get('text')).equal('');
            expect(model.get('category')).equal('none')
            return transaction.commit().then(() => {
                expect(model.get('text')).equal('koteł');
                expect(model.get('category')).equal('zwierzę')
            });
            //const transaction = model.$transaction();

        });
        it('should call onCommit and onEnd handlers after commiting', () => {
            let c = 0;
            let d = 0;
            const transaction = new Transaction({
                onCommit(t) {
                    c++;
                    expect(t).equal(transaction);
                },
                onEnd(t) {
                    d++;
                    expect(t).equal(transaction);
                }
            });
            expect(c).equal(0, 'it should not call onCommit during creation');
            expect(d).equal(0, 'it should not call onEnd during creation');

            return transaction.commit().then(() => {
                expect(c).equal(1);
                expect(d).equal(1);
            });
        });
        it('should call onInit handler after creation', () => {
            let c = 0;
            let transactionFromOnInit;
            const transaction = new Transaction({
                onInit(t) {
                    c++;
                    transactionFromOnInit = t;
                }
            });
            expect(c).equal(1);
            expect(transactionFromOnInit).equal(transaction);
            transaction.commit();
            expect(c).equal(1, 'it should not call onInit during committing');
        });
        it('should call custom handler', () => {
            let foo = 0;
            let transactionFromOnInit;
            const transaction = new Transaction({
                onFoo(t) {
                    foo++;
                    transactionFromOnInit = t;
                }
            });
            transaction.foo();
            expect(foo).equal(1);
            expect(transactionFromOnInit).equal(transaction);
        });
        it('should call custom handlers in array', () => {
            let a = 0;
            let b = 0;
            let c = 0;
            const transaction = new Transaction({
                onFoo: [
                  t => {
                    a++; expect(t).equal(transaction);
                  },
                  t => {
                    b++; expect(t).equal(transaction);
                  },
                  t => {
                    c++; expect(t).equal(transaction);
                  },
                ]
            });
            return transaction.foo().then(() => {
                expect(a).equal(1);
                expect(b).equal(1);
                expect(c).equal(1);
            });
        });
        it('should call custom handlers in array (using promises)', () => {
            let a = 0;
            let b = 0;
            let c = 0;
            let resolveFirst;
            const transaction = new Transaction({
                onFoo: [
                  t => {
                    a++;
                    expect(t).equal(transaction);
                    return Promise.resolve();
                  },
                  t => {
                    b++;
                    expect(a).equal(1);
                    expect(b).equal(1);
                    expect(c).equal(0);
                    expect(t).equal(transaction);
                  },
                  t => {
                    c++;
                    expect(t).equal(transaction);
                  },
                ]
            });
            const fooDone = transaction.foo();
            expect(a).equal(1);
            expect(b).equal(0);
            expect(c).equal(0);

            return fooDone.then(() => {
                expect(a).equal(1);
                expect(b).equal(1);
                expect(c).equal(1);
            });
            //expect(transactionFromOnInit).equal(transaction);
        });
    });

    it('should validate and commit if there are no errors (return undefined)', () => {
        let validationCalled = 0;
        let committed = 0;
        const transaction = new Transaction({
            onValidate() {
                validationCalled++;
            },
            onCommit() {
                committed++;
            }
        });
        return transaction.commit().then(() => {
            expect(validationCalled).equal(1);
            expect(committed).equal(1);
            expect(transaction.ended).equal(true);
        });
    });

    it('should validate and commit if there are no errors (return empty array) ', () => {
        let validationCalled = 0;
        let committed = 0;
        const transaction = new Transaction({
            onValidate() {
                validationCalled++;
                return [];
            },
            onCommit() {
                committed++;
            }
        });
        return transaction.commit().then(() => {
            expect(validationCalled).equal(1);
            expect(committed).equal(1);
            expect(transaction.ended).equal(true);
        });
    });


    it('should validate and don\'t commit if there are errors', () => {
        let validationCalled = 0;
        let committed = 0;
        const transaction = new Transaction({
            onValidate() {
                validationCalled++;
                return ['error', 'error2'];
            },
            onCommit() {
                committed++;
            }
        });
        return transaction.commit().then(() => {
            expect(validationCalled).equal(1);
            expect(committed).equal(0);
            expect(transaction.ended).equal(false);
        });
    });

    it('should have errors property and it should be empty when transaction is created', () => {
        const transaction = new Transaction({
            onValidate() {return ['error']}
        });
        expect(transaction.errors).deep.equal([]);
    });

    it('after failed validation it should assign to `errors`', () => {
        const transaction = new Transaction({
            onValidate() {return ['someError']}
        });
        return transaction.commit().then(() => {
            expect(transaction.errors).deep.equal(['someError']);
        });
    });

    it('after passed validation `errors` should be empty array', () => {
        const transaction = new Transaction({
            onValidate() {}
        });
        transaction.errors = ['some previous error'];
        return transaction.commit().then(() => {
            expect(transaction.errors).deep.equal([]);
        });

    });

    it('should not call handler after transaction has ended', () => {
        let a = 0;
        let b = 0;
        let c = 0;
        let resolveFirst;
        const transaction = new Transaction({
            onFoo: [
              t => {
                a++;
                expect(t).equal(transaction);
                return Promise.resolve();
              },
              t => {
                b++;
                expect(a).equal(1);
                expect(b).equal(1);
                expect(c).equal(0);
                expect(t).equal(transaction);
                t.end();
              },
              t => {
                c++;
                expect(t).equal(transaction);
              },
            ]
        });
        const fooDone = transaction.foo();
        expect(a).equal(1);
        expect(b).equal(0);
        expect(c).equal(0);

        // TODO catch
        return fooDone.then(() => {
            expect(a).equal(1);
            expect(b).equal(1);
            expect(c).equal(0);
        });
        //expect(transactionFromOnInit).equal(transaction);
    });


    it('should assign ending state in transactions', () => {
        const model = new TransactionExampleModel;

        model.$transaction((transaction, aModel) => {
            transaction.end({status: 'error'});
        }, {status: 'loading', a:1});

        assert.equal(model.get('status'), 'error');
        assert.equal(model.get('a'), undefined);
    });

    // TODO remove autocorrection logic out of this package
    it('should return autocorrect suggestion', () => {
        const model = new Example6;
        assert.equal(api.autocorrect(model, 'gumbuear'), 'gummibear');
        assert.equal(api.autocorrect(model, 'cynDerela'), 'cinderella');
        assert.equal(api.autocorrect(model, 'Sylsveer'), 'sylvester');
        assert.equal(api.autocorrect(model, 'yobuear'), 'yogibear');
        assert.equal(api.autocorrect(model, 'smrf'), 'smurf');

        assert.equal(api.autocorrect(model, 'mmbear'), 'gummibear');
        assert.equal(api.autocorrect(model, 'ynDerelax'), 'cinderella');
        assert.equal(api.autocorrect(model, 'ylsveers'), 'sylvester');
        assert.equal(api.autocorrect(model, 'obuear'), 'yogibear');
        assert.equal(api.autocorrect(model, 'mrf'), 'smurf');
    });

});


describe(`${FRAMEWORK} API:`, () => {
    describe(`${FRAMEWORK}.model(description) creates model`, () => {
        let model;
        const initialState = {
            name: 'John',
            counter: 0,
        };
        beforeEach(() => {
            model = api.model({
                data: initialState,
                actions: {
                    inc(state) {
                        state.counter++;
                    },
                }
            });
        });
        it('that is instance of Model', () => {
            expect(model).to.be.instanceof(Model);
        });
        it('that has correct initial state', () => {
            const state = model.get();
            expect(state).to.deep.equal({
                name: 'John', counter: 0
            });
            expect(state).to.not.equal(initialState);
        });
        it('that has declared action which change state correctly', (done) => {
            model.$subscribe(() => {
                expect(model.get()).deep.equal({
                    name: 'John',
                    counter: 1,
                })
                done();
            });
            model.inc();
        });

    });
});
