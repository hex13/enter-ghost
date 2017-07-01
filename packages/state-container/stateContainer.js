const EventEmitter = require('events');

// `constructor` is ES6 class constructor (inb4: thank you captain obvious XD).
// methods beginning with `$`` are helpers
// methods beginning with `get` are getters
// rest of methods are actions
// only actions are recorded.

class Model {
    constructor(...args) {
        this._initialArgs = args;
        this.ee = new EventEmitter;

        this.$reset();

        const methods = Object.getOwnPropertyNames(this.__proto__)
            .filter(n => n != 'constructor' && n.charAt(0) != '$' && n.indexOf('get') != 0);

        methods.forEach(meth => {
            const original = this[meth];
            this[meth] = (...args) => {
                this._calls.push([meth, args]);
                const res = original.apply(this, [this.state].concat(args));
                this.ee.emit('change')
                return res;
            };
        });
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
        this._calls = [];
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
    $transaction(callback) {
        const transaction = {
            end() {
            },
        };
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
