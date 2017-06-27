const EventEmitter = require('events');

exports.Model = class {
    constructor(state = {}) {
        this._serializedInitialState = JSON.stringify(state);
        this.state = state;
        this.ee = new EventEmitter;
        this._calls = [];

        const methods = Object.getOwnPropertyNames(this.__proto__).filter(n => n != 'constructor');
        methods.forEach(meth => {
            const original = this[meth];
            this[meth] = (...args) => {
                this._calls.push([meth, args]);
                const res = original.apply(this.state, args);
                this.ee.emit('change')
                return res;
            };
        });
    }
    subscribe(f) {
        this.ee.on('change', f);
    }
    undo() {
        this.reset();
        // event sourcing! (we replay previously stored method calls)
        this._calls.slice(0, -1).forEach(([meth, args]) => {
            this[meth](...args);
        });
    }
    reset() {
        this.state = JSON.parse(this._serializedInitialState);
    }
};
