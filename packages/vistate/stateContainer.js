"use strict";

const EventEmitter = require('events');

// for autocorrection
const leven = require('leven');

function correct(phrase, texts) {
    phrase = phrase.toLowerCase();
    return texts
        .map(t => [t,leven(t.toLowerCase(), phrase)])
        .sort((a,b)=>{return a[1]-b[1]})[0][0];
}

function createEvent(model, type, args) {
    return {target: model.$localId(), type, args};
}


const reducerMiddleware = {
    processResult(state) {
        this.state = state;
    }
}


class Recorder {
    constructor() {
        this._calls = [];
    }
    record(event) {
        this._calls.push(event);
    }
    reset() {
        if (this._calls.length) this._calls = [];
    }
    getCalls() {
        return this._calls;
    }
    undo(cb) {
        this._calls.pop();
        this._calls.forEach(cb);
    }
}



const Transaction = require('./transaction');


const ROOT_LOCAL_ID = 1;
// `constructor` is ES6 class constructor (inb4: thank you captain obvious XD).
// methods beginning with `$`` are helpers
// methods beginning with `get` are getters
// methods beginning with `_` are private methods
// rest of methods are actions
// only actions are recorded.

function _getProps(obj) {
    const props = {};
    let curr = obj;
    for (let curr = obj; curr && curr !== Object.prototype; curr = curr.__proto__) {
        Object.getOwnPropertyNames(curr).forEach(k => {
            if (!props.hasOwnProperty(k)) props[k] = true;
        });
    }
    return Object.keys(props);
}

class Model {
    constructor(...args) {
        this._initialArgs = args;
        this.ee = new EventEmitter;
        this._parent = null;
        this._root = this;
        this._localId = ROOT_LOCAL_ID;
        this._models = new Map;
        this._recorder = new Recorder;

        // TODO refactor further
        // inlined content of $reset method
        this._lastLocalId = this._localId;

        this._recorder.reset();
        // END TODO

    }
    $afterChildAction(child, actionName) {

    }
    $notify(changedModel) {
        const isRoot = this._root === this;
        if (isRoot) {
            this.ee.emit('change', changedModel);
        } else {
            this._root.$notify(changedModel);
        }
    }
    $subscribe(f, subject = this) {
        const isRoot = this._root === this;
        if (isRoot) {
            this._root.ee.on('change', (changedModel) => {
                if (subject === this || subject.$localId() === changedModel.$localId()) {
                    f(changedModel)
                }
            });
        } else {
            this._root.$subscribe(f, this);
        }

    }
    _connectChildren() {
        for (let prop in this.state) {
            let child = this.state[prop];
            if (child instanceof Model) {
                child.$connect({parent: this, root: this._root});
            }
        }
    }
    $connect({ parent, root }) {
        this._parent = parent;
        // TODO partial connecting
        //if (parent) this._parent = parent;
        //if (root) this._root = root;
        this._root = root;
        this._recorder = root._recorder;
        this._localId = root.$register(this);
        this._connectChildren();
    }
    $dispatch({target, type, args}) {
        let model = this;
        if (target && target != ROOT_LOCAL_ID ) {
            model = this._models.get(target);
        }
        model[type](...args);
    }
    $compatible() {
        return {
            dispatch: this.$dispatch.bind(this),
            getState:() => this.state
        }
    }
    $localId() {
        return this._localId;
    }
    $register(model) {
        const localId = ++this._lastLocalId;
        this._models.set(localId, model);
        return localId;
    }
    $transaction(callback, tempState) {
        const transaction = new Transaction({
            onEnd: resultState => {
                Object.assign(this.state, savedState);
                Object.assign(this.state, resultState);
            }
        });
        let savedState = {};
        Object.keys(tempState).forEach(k => {
            savedState[k] = this.state[k];
        });
        Object.assign(this.state, tempState); // TODO extract as action
        return callback(transaction, this);
    }
    get(prop) {
        const state = this.state;

        if (!prop)
            return state;

        if (state.hasOwnProperty(prop)) {
            return state[prop];
        }
    }
    set(state, k, v) {
        state[k] = v;
    }
    $initialState() {
        return {};
    }
    assignId(id) {
        this.$$id = id;
    }
    $id() {
        return this.$$id;
    }
    $identity() {
        return this;
    }
    $root() {
        return this._root;
    }
};

const generateId = (last => () => ++last)(0);



const vistate = {
    middlewares: {
        runHandlerAndNotify(actionData) {
            const { original, value, model, name, args } = actionData;
            const res = original.apply(model, [model.state].concat(args));
            model._root.$afterChildAction(model, name);
            model.$notify(model);
            actionData.value = res;
        },
        record(actionData) {
           const { value, model, name, args } = actionData;
           model._recorder.record(createEvent(model, name, args));
       },
       reducers(actionData) {
           actionData.model.state = actionData.value;
       }
    },
    dbg(model) {
        return JSON.stringify(model.state);
    },
    events(model) {
        return model._recorder.getCalls().filter(event => {
            return model.$root() == model || event.target == model.$localId();
        });
    },
    reset(model) {
        model.$reset();
    },
    autocorrect(model, methodName) {
        const props = Object.keys(model);
        return correct(methodName, props);
    },
    undo(model) {
        const tmp = vistate.model(new model.constructor());
        model._recorder.undo(event => {
            tmp.$dispatch(event);
        });
        model.state = tmp.get();
        model.$notify(model);
    },
    model(description, params = {}) {
        let model;
        if (description instanceof Model) {
            model = description;
        } else {
            class AdHocModel extends Model {
                $initialState() {
                    const state = {};
                    for (let k in description.data) {
                        state[k] = description.data[k]
                    };
                    return state;
                }
            }
            for (let k in description.actions) {
                AdHocModel.prototype[k] = description.actions[k];
            }
            model = new AdHocModel();
        }

        let methods = _getProps(model.__proto__)
            .filter(n => n != 'constructor'
                && n.charAt(0) != '$'
                && n.charAt(0) != '_'
                && n.indexOf('get') != 0
            );


        methods.forEach(name => {
            const original = model[name];
            const middlewares = [
                vistate.middlewares.runHandlerAndNotify,
                vistate.middlewares.record,
            ];
            if (params.use) {
                middlewares.push.apply(middlewares, params.use.map(middleware => {
                    if (vistate.middlewares.hasOwnProperty(middleware))
                        return vistate.middlewares[middleware];
                    else throw new Error('no middleware: \'' + middleware + '\'')
                }));
            }

            model[name] = (...args) => {
                const actionData = { original, value: undefined, model, name, args };
                middlewares.forEach(curr => {
                    curr(actionData);
                });
                return actionData.value;
            }
        });


        model.state = model.$initialState(...model._initialArgs);

        // create models from properties
        for (let p in model.state) {
            if (model.state[p] instanceof Model) {
                model.state[p] = vistate.model(model.state[p])
            }
        }
        model._connectChildren();


        return model;
    }
};

module.exports = {
    Model,
    createEvent,
    Transaction,
    ROOT_LOCAL_ID,
    reducerMiddleware,
    vistate,
    create(Cls, ...args) {
        const model = vistate.model(new Cls(...args));
        model.assignId(generateId());
        return model;
    }
};
