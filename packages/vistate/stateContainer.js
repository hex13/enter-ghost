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

const ROOT_LOCAL_ID = 1234;
// `constructor` is ES6 class constructor (inb4: thank you captain obvious XD).
// methods beginning with `$`` are helpers
// methods beginning with `get` are getters
// methods beginning with `_` are private methods
// rest of methods are actions
// only actions are recorded.

class Model {
    constructor(...args) {
        this._initialArgs = args;
        this.ee = new EventEmitter;
        this._parent = null;
        this._root = this;
        this._localId = ROOT_LOCAL_ID;
        this._models = new Map;

        this.$reset();
        const methods = Object.getOwnPropertyNames(this.__proto__)
            .filter(n => n != 'constructor'
                && n.charAt(0) != '$'
                && n.charAt(0) != '_'
                && n.indexOf('get') != 0
            );

        methods.forEach(meth => {
            const original = this[meth];
            this[meth] = (...args) => {
                this.$record(createEvent(this, meth, args));
                const res = original.apply(this, [this.state].concat(args));
                this.$notify(this);
                return res;
            };
        });
    }
    $record(event) {
        this._calls.push(event);
        if (this._root !== this) {
            this._root.$record(event);
        }
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
                if (subject === this || subject === changedModel) {
                    f(changedModel)
                }
            });
        } else {
            this._root.$subscribe(f, this);
        }

    }
    $undo() {
        const calls = this._calls;
        this.$reset();
        // event sourcing (we replay previously stored method calls)
        calls.slice(0, -1).forEach(event => {
            this.$dispatch(event)
        });
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
        this._calls = [];
    }
    $connect({ parent, root }) {
        this._parent = parent;
        // TODO partial connecting
        //if (parent) this._parent = parent;
        //if (root) this._root = root;
        this._root = root;
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
    $dbg() {
        return JSON.stringify(this.state);
    }
    $transaction(callback, tempState) {
        const transaction = {
            end: (resultState) => {
                Object.assign(this.state, savedState);
                Object.assign(this.state, resultState);
            },
        };
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
    $autocorrect(methodName) {
        const props = Object.keys(this);
        return correct(methodName, props);
    }
    $events() {
        return this._calls;
    }
};

const generateId = (last => () => ++last)(0);

module.exports = {
    Model,
    createEvent,
    ROOT_LOCAL_ID,
    create(Cls, ...args) {
        const model = new Cls(...args);
        model.assignId(generateId());
        return model;
    }
};
