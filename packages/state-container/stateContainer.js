const EventEmitter = require('events');

// for autocorrection
const leven = require('leven');

function correct(phrase, texts) {
    phrase = phrase.toLowerCase();
    return texts
        .map(t => [t,leven(t.toLowerCase(), phrase)])
        .sort((a,b)=>{return a[1]-b[1]})[0][0];
}


// `constructor` is ES6 class constructor (inb4: thank you captain obvious XD).
// methods beginning with `$`` are helpers
// methods beginning with `get` are getters
// rest of methods are actions
// only actions are recorded.

class Model {
    constructor(...args) {
        this._initialArgs = args;
        this.ee = new EventEmitter;
        this._parent = null;

        this.$reset();
        const methods = Object.getOwnPropertyNames(this.__proto__)
            .filter(n => n != 'constructor' && n.charAt(0) != '$' && n.indexOf('get') != 0);

        methods.forEach(meth => {
            const original = this[meth];
            this[meth] = (...args) => {
                this._calls.push([meth, args]);
                const res = original.apply(this, [this.state].concat(args));
                this.$notify(this);
                return res;
            };
        });
    }
    $notify(changedModel) {
        this.ee.emit('change', changedModel);
        this._parent && this._parent.$notify(changedModel);
    }
    $subscribe(f) {
        this.ee.on('change', f);
    }
    $undo() {
        const calls = this._calls;
        this.$reset();
        // event sourcing (we replay previously stored method calls)
        calls.slice(0, -1).forEach(([meth, args]) => {
            this[meth](...args);
        });
    }
    $reset() {
        this.state = this.$initialState(...this._initialArgs);
        for (let prop in this.state) {
            const child = this.state[prop];
            if (child instanceof Model) {
                child.$connect(this);
            }
        }
        this._calls = [];
    }
    $connect(parent) {
        this._parent = parent;
    }
    $dispatch({type, args}) {
        this[type](...args);
    }
    $compatible() {
        return {
            dispatch: this.$dispatch.bind(this),
            getState:() => this.state
        }
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
    $autocorrect(methodName) {
        const props = Object.keys(this);
        return correct(methodName, props);
    }
};

const generateId = (last => () => ++last)(0);

module.exports = {
    Model,
    create(Cls, ...args) {
        const model = new Cls(...args);
        model.assignId(generateId());
        return model;
    }
};
