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

function createRecordable(func, name, model, onCall) {
    return (...args) => {
        onCall(createEvent(model, name, args));
        const res = func(...args);
        return res;
    };
};
function createRecorderMiddleware(model) {
    return {
        run: createRecordable,
        args: [model, (event) => {
            model._recorder.record(event);
        }]
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


const ROOT_LOCAL_ID = 1234;
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
        this._middleware = {};
        this._recorder = new Recorder;

        this.$reset();
        const methods = _getProps(this.__proto__)
            .filter(n => n != 'constructor'
                && n.charAt(0) != '$'
                && n.charAt(0) != '_'
                && n.indexOf('get') != 0
            );


        methods.forEach(name => {
            const middlewares = [
                this._createAction.bind(this),
                createRecorderMiddleware(this)
            ];

            this[name] = middlewares.reduce((prev, curr) => {
                return (curr.run || curr)(prev, name, ...(curr.args || []));
            }, this[name]);
        });
    }
    _createAction(original, meth) {
        return (...args) => {
            const res = original.apply(this, [this.state].concat(args));
            this._root.$afterChildAction(this, meth);
            if (this._middleware.processResult) this._middleware.processResult.call(this, res);
            this.$notify(this);
            return res;
        };
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
    $use(middlewares) {
        for (let name in middlewares) {
            this._middleware[name] = middlewares[name];
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
            const child = this.state[prop];
            if (child instanceof Model) {
                child.$connect({parent: this, root: this._root});
            }
        }
    }
    $reset() {
        this._lastLocalId = this._localId;
        this.state = this.$initialState(...this._initialArgs);
        this._connectChildren();
        this._recorder.reset();
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


// for compatibility with Redux style reducers
const reducerMiddleware = {
    processResult(state) {
        this.state = state;
    }
}

const vistate = {
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
        const tmp = new model.constructor();
        model._recorder.undo(event => {
            tmp.$dispatch(event)
        });
        model.state = tmp.get();
        model.$notify(model);
    },
    model(description) {
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

        const model = new AdHocModel();
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
        const model = new Cls(...args);
        model.assignId(generateId());
        return model;
    }
};
