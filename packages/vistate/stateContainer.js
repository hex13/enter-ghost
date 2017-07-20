"use strict";

const EventEmitter = require('events');

// for autocorrection
const leven = require('leven');

const middleware = require('./middleware');

function correct(phrase, texts) {
    phrase = phrase.toLowerCase();
    return texts
        .map(t => [t,leven(t.toLowerCase(), phrase)])
        .sort((a,b)=>{return a[1]-b[1]})[0][0];
}

function _connectChildren(root, model, data) {
    for (let prop in data) {
        let child = data[prop];
        if (child instanceof Model) {
            child._root = root;
            child._recorder = root._recorder;
            child._localId = root.$register(child);
            _connectChildren(root, child, child.state);
        }
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
        this._root = this;
        this._localId = ROOT_LOCAL_ID;
        this._models = new Map;
        this._lastLocalId = this._localId;
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
    middleware,
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
    dispatch(model, {target, type, args}) {
        if (target && target != ROOT_LOCAL_ID ) {
            model = model._models.get(target);
        }
        model[type](...args);
    },
    undo(model) {
        const tmp = vistate.model(new model.constructor());
        model._recorder.undo(event => {
            this.dispatch(tmp, event);
        });
        model.state = tmp.get();
        model.$notify(model);
    },
    model(description, params = {}) {
        let model;
        if (description instanceof Model) {
            model = description;
            if (model._INITIALIZED) return model;
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
                vistate.middleware.runHandlerAndNotify,
                vistate.middleware.record,
            ];
            if (params.use) {
                middlewares.push.apply(middlewares, params.use.map(middleware => {
                    if (vistate.middleware.hasOwnProperty(middleware))
                        return vistate.middleware[middleware];
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
        model._recorder = new Recorder;

        _connectChildren(model._root, model, model.state);
        model._INITIALIZED = true;
        model._metadata = {type: description.type};

        return model;
    },
    metadata(model) {
        return model._metadata;
    }
};

module.exports = {
    Model,
    Transaction,
    ROOT_LOCAL_ID,
    vistate,
    create(Cls, ...args) {
        const model = vistate.model(new Cls(...args));
        model.assignId(generateId());
        return model;
    }
};
