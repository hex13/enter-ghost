const EventEmitter = require('events');

exports.Model = class {
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
};
