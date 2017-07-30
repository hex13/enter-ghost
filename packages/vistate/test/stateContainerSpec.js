"use strict";

const FRAMEWORK = 'vistate';
const assert = require('assert');

const { expect } = require('chai');

const { Model, ROOT_LOCAL_ID, Transaction, isModel } = require('..');
const createEvent = require('../createEvent');

const sc = require('..');
const api = sc.vistate;
function $undo(model) {
    return api.undo(model);
}
function $reset(model) {
    return api.reset(model);
}
function $events(model) {
    return api.events(model);
}
function $model(...args) {
    return api.model(...args);
}
function $hierarchyModel() {
    return $model(Hierarchy);
}
function $exampleModel() {
    return $model({
        data: {value: 100},
        actions: {
            foo(state, a) {
                return a + 1;
            },
            doFoo(state, a) {
                state.value = 'some mutation';
            },
            inc(state, amount) {
                state.value += amount;
            }
        }
    })
}
function $typeName(model) {
    const md = api.metadata(model);
    return md.type;
}



const TransactionExampleModel = {
    data: {
        status: 'normal',
        text: '',
        category: 'none',
    },
    actions: {
        setText(state, text) {
            state.text = text;
        },
        setCategory(state, category) {
            state.category = category;
        }
    }
}

const Example6 = {
    actions: {
        gummibear() {

        },
        smurf() {

        },
        yogibear() {

        },
        sylvester() {

        },
        cinderella() {

        }

    }
}

const Hierarchy = {
    actions: {someAction() {} },
    data: {
        child: () => api.model({
            type: 'Child',
            data: {
                x: 10,
                grandChild:  api.model({
                    type: 'GrandChild',
                    data: {
                        y: 100,
                        grandGrandChild: api.model({
                            data: {
                                z: 102
                            },
                            actions: {
                                baz(state) {
                                    state.z++;
                                }
                            }
                        })
                    },
                    actions: {
                        bar(state, y) {
                            state.y = y;
                        },
                    }
                })
            },
            actions: {
                foo(state, x) {
                    state.x = x;
                },
            }
        })
    }
};


// class Example8 extends Model {
//     _privateMethod() {
//
//     }
// }


function pseudoAjax() {
    return Promise.resolve('Nevermore');
}

let _require = require;

describe('factory', () => {
    xit('should create models and assign unique ids (for 1000 objects)', () => {
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
    it('should work', (renderYourView) => {
        const require = () => _require('..');

        //------ EXAMPLE

        const { vistate } = require('vistate');

        const model = vistate.model({
            data: {value: 100},
            actions: {
                inc(state, amount) {
                    state.value += amount;
                }
            }
        });

        model.$subscribe(() => {
            console.log("update your view here");
            console.log("current state:", model.state);
            renderYourView();
        });

        model.inc();
        //----- END EXAMPLE
    });
});

describe('model', () => {
    describe('events', () => {
        it(`it should record events and expose them via ${FRAMEWORK}.events()`, () => {
            const model = $exampleModel();
            model.inc(10);
            model.foo('a', {a: 4});
            const events = $events(model);
            expect(events).deep.equal([
                createEvent(model, 'inc', [10]),
                createEvent(model, 'foo', ['a', {a: 4}]),
            ]);
            let md = api.metadata(events[0]);

            expect(md.mutations).deep.equal([
                [['value'], 110]
            ]);
        });
        it('it should record events and expose them via $events (models in hierarchy). Root should gather all events', () => {
            const model = $hierarchyModel();
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

    it('should run factories in data', () => {
        const model = $model({
            data: {
                a: () => 'ooo'
            }
        });
        expect(model.get('a')).equal('ooo');
    });

    describe('hierarchy', () => {
        it('should assign local ids', () => {
            const root = $hierarchyModel();
            expect(root.$localId()).equal(ROOT_LOCAL_ID);
            expect(root.get('child').$localId()).equal(ROOT_LOCAL_ID + 1);
            expect(root.get('child').get('grandChild').$localId()).equal(ROOT_LOCAL_ID + 2);
        });

        it('should allow for undo whole hierarchy', () => {
            const root = $hierarchyModel();
            root.get('child').foo(200);
            expect(root.get('child').get('x')).equal(200);
            root.get('child').foo(300);
            expect(root.get('child').get('x')).equal(300);

            $undo(root);
            expect(root.get('child').get('x')).equal(200);
        });

        it('should create children and children should notify parent about updates', () => {
            const root = $hierarchyModel();
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
            const root = $hierarchyModel();
            assert.strictEqual(api.root(root), root);
            assert.strictEqual(api.root(root.get('child')), root);
            assert.strictEqual(api.root(root.get('child').get('grandChild')), root);
        });
        it('should create grand children and grand children should notify root about updates', () => {
            const root = $hierarchyModel();
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
            const root = $hierarchyModel();
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
        const model = $model(new Model);
        assert.deepEqual(model.get(), {});
    });

    it('should call wrapped method and return correct result', () => {
        const model = $exampleModel();

        assert.equal(model.foo(10), 11);
        assert.equal(model.foo(0), 1);
        assert.equal(model.foo(3), 4);
    });

    it('should trigger change handler after each action which mutates state', () => {
        const model = $exampleModel();
        let updateCount = 0;

        model.$subscribe(() => {
            updateCount++;
        });

        model.doFoo();
        model.doFoo();
        model.doFoo();

        assert.equal(updateCount, 3);
    });

    it('should not trigger change handler after actions that don\'t mutate state', () => {
        const model = $exampleModel();
        let updateCount = 0;

        model.$subscribe(() => {
            updateCount++;
        });

        model.foo();
        model.foo();
        model.foo();

        assert.equal(updateCount, 0);
    });



    it('should have return correct initial state', () => {
        const model = $model({
            data: {a: 10, b: 20, c: 'kotek'}
        });
        assert.deepEqual(model.state, {a: 10, b: 20, c: 'kotek'});

        assert.deepEqual(model.get(), {a: 10, b: 20, c: 'kotek'});

        assert.deepEqual(model.get('a'), 10);
        assert.deepEqual(model.get('b'), 20);
        assert.deepEqual(model.get('c'), 'kotek');
        assert.deepEqual(model.get('toString'), undefined, 'it shouldn\'t return properties from Object.prototype');
    });

    xit('should have return correct initial state (when passing args into constructor)', () => {
        const model = $model(new Example4(10, 20, 'kotek'));
        assert.deepEqual(model.state, {a: 10, b: 20, c: 'kotek'});

        assert.deepEqual(model.get(), {a: 10, b: 20, c: 'kotek'});

        assert.deepEqual(model.get('a'), 10);
        assert.deepEqual(model.get('b'), 20);
        assert.deepEqual(model.get('c'), 'kotek');
        assert.deepEqual(model.get('toString'), undefined, 'it shouldn\'t return properties from Object.prototype');
    });


    it('should mutate state', () => {
        const model = $exampleModel();
        model.inc(10);
        model.inc(100);
        model.inc(1000);
        assert.deepEqual(model.state, {value: 1210});
    });

    xit('should use processResult middleware', () => {
        const model = $exampleModel();
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

    it('should mutate state (using reducer middleware)', () => {
        const model = $model({
            data: {value: 100},
            actions: {
                inc: (state, amount) => ({value: state.value + amount})
            }
        }, {
            use: ['reducers'],
        });
        let c = 0;
        model.inc(10);
        model.inc(100);
        model.inc(1000);
        assert.deepEqual(model.state, {value: 1210});
    });

    xit('should reset state', () => {
        const model = new Example;
        model.inc(10);
        model.inc(100);
        model.inc(1000);
        $reset(model);
        assert.deepEqual(model.state, {value: 100});
    });

    xit('should reset state, and also recorder actions', () => {
        const model = new Example;
        model.inc(10);
        model.inc(100);
        model.inc(1000);
        $reset(model);
        model.inc(1000);
        $undo(model);
        assert.deepEqual(model.state, {value: 100});
    });

    it('should undo state', () => {
        const model = $exampleModel();
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
        const model = $exampleModel();

        api.dispatch(model, {type: 'inc', args:[1]});

        assert.deepEqual(model.state, {value: 101});
    });


    xit('should not trigger change handler,when $subscribe(), $compatible(), $dbg() or get.*() are called', () => {
        [
            $exampleModel(), // class with #get inherited from model
            $model(new Example3), // class which overrides #get
            $model(new Example8), // class with private method
        ].forEach(model => {
            let c = 0;
            model.$subscribe(() => c++);

            // some calls
            model.$subscribe(() => {});

            model.get();
            model.get('whatever');
            model.getFoo && model.getFoo();
            model._privateMethod && model._privateMethod();

            let expected = 0;
            assert.equal(c, expected, `incorrect number of updates for ${model.constructor.name}. It should be ${expected} but is ${c}`);
        });

    });

    it('should handle transactions', () => {
        const model = $model(TransactionExampleModel);

        return api.transaction(model, (transaction, aModel) => {
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
        [$model({})].forEach(model => {
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
            const model = $model(TransactionExampleModel);
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
        const model = $model(TransactionExampleModel);

        api.transaction(model, (transaction, aModel) => {
            transaction.end({status: 'error'});
        }, {status: 'loading', a:1});

        assert.equal(model.get('status'), 'error');
        assert.equal(model.get('a'), undefined);
    });

    // TODO remove autocorrection logic out of this package
    it('should return autocorrect suggestion', () => {
        const model = $model(Example6);
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
        it('that is a model, according to function isModel', () => {
            assert(isModel(model));
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
    describe(`${FRAMEWORK}.collection() creates collection`, () => {
        let collection;

        beforeEach(() => {
            collection = api.collection();
        });

        it('that is instance of Model', () => {
            assert(isModel(collection));
        });
        it('that is empty when created', () => {
            expect(collection.get()).deep.equal([]);
        });

        it('that allows for adding elements', () => {
            collection.add(123);
            collection.add(456);
            expect(collection.get()).deep.equal([123, 456]);
        });

        it('that triggers change handlers after element actions', () => {
            const model = api.model({
                data: {
                    v: 0,
                },
                actions: {
                    foo(state) {
                        state.v = 1234;
                    }
                }
            });
            collection.add(model);

            let c = 0;
            collection.$subscribe(() => {
                c++;
            });

            model.foo();
            model.foo();
            model.foo();

            expect(c).equal(3);
        });


    });

    xdescribe(`${FRAMEWORK}.delegateTo() allows for delegating actions`, () => {
        let model;

        beforeEach(() => {
            model = api.model({
                data: {
                    counter: api.model({
                        data: {v: 100},
                        actions: {inc: state => state.v++},
                    })
                },
                actions: {
                        //inc: api.delegateTo('counter', 'inc'),
                        inc: delegateTo('counter'),
                        inc: state => state.counter.inc()
                }
            });
        });

        it('that is a model', () => {
            assert(isModel(model));
        });

        it('that allow for delegating actions to child models', () => {
            model.inc();
            expect(model.get('counter').get()).deep.equal({v: 101})
        });


    });
});
