class Transaction {
    constructor(handlers = {}) {
        this.onEnd = handlers.onEnd;
        this.onCommit = handlers.onCommit;
        for (let eventName in handlers) {
            if (
                eventName.slice(0, 2) == 'on'
                && eventName != 'onEnd'
                && eventName != 'onCommit'
                && eventName != 'onInit'
            ) {
                const taskName = eventName.charAt(2).toLowerCase() + eventName.slice(3);
                const task = handlers[eventName];
                if (typeof task == 'function') {
                  this[taskName] = () => {
                      handlers[eventName](this);
                  }
                } else if (Array.isArray(task)) {
                  this[taskName] = () => {
                      task.forEach(handler => handler(this));
                  }
                }
            }
        }
        this._tasks = [];
        this._data = Object.create(null);

        handlers.onInit && handlers.onInit(this);
    }
    data(k, v) {
        if (k === undefined) return this._data;
        if (v === undefined) return this._data[k];
        this._data[k] = v;
    }
    task(cb) {
        this._tasks.push(cb);
    }
    // cancel() {
    //     this.onEnd && this.onEnd(this);
    // }
    commit() {
        this._tasks.forEach(task => task());
        this.onCommit && this.onCommit(this);
        this.onEnd && this.onEnd(this);
    }
    end(resultState) {
        this.onEnd && this.onEnd(resultState);
    }
}

module.exports = Transaction;
