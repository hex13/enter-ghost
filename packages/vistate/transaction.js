"use strict";

class Transaction {
    constructor(handlers = {}) {
        this.onEnd = handlers.onEnd;
        this.onCommit = handlers.onCommit;
        this.ended = false;

        // TODO extract
        // this._generateMethods(this, handlers);
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
                      return handlers[eventName](this);
                  }
                } else if (Array.isArray(task)) {
                  this[taskName] = () => {
                      const [first, ...rest] = task;
                      let last = Promise.resolve(first(this));
                      rest.forEach((handler, i) => {
                          last = last.then(() => {
                              if (this.ended) {
                                  return
                              }
                              return Promise.resolve(handler(this));
                          });
                      });
                      return last;
                  }
                }
            }
        }
        this._tasks = [];
        handlers.onInit && handlers.onInit(this);
    }
    commit() {
        const validate = Promise.resolve(this.validate && this.validate());
        return validate.then(errors => {
            if (errors) return;

            this._tasks.forEach(task => task());
            this.onCommit && this.onCommit(this);
            this.end(this)
        });
    }
    end(resultState) {
        this.ended = true;
        this.onEnd && this.onEnd(resultState);
    }
}

const proposed = {
    cancel() {
        this.onEnd && this.onEnd(this);
    },
    validate(t) {
        if (dataAreGood) {
            return;
        } else
            return arrayWithErrors;
    }
};

const deprecated = {
    task(cb) {
        console.error('Transaction::task() is deprecated. Use event based approach')
        this._tasks.push(cb);
    }
};

Object.assign(Transaction.prototype, deprecated);

module.exports = Transaction;
