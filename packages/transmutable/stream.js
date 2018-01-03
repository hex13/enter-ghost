'use strict';
const { get } = require('./get-set');

function Stream() {
    const observers = [];
    return {
        publish(...args) {
            observers.forEach(o => o(...args));
        },
        subscribe(observer, path) {
            observers.push((nextState, lastState) => {
                if (get(lastState, path) !== get(nextState, path))
                    observer(get(nextState, path))
            });
        },
    }
}

exports.Stream = Stream;
