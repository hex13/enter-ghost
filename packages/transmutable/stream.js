'use strict';
const { get } = require('./get-set');

function Stream() {
    const observers = [];
    return {
        publish(...args) {
            observers.forEach(o => o(...args));
        },
        subscribe(observer) {
            observers.push(observer);
        },
        select(path) {
            return this.filter((nextState, lastState) => {
                return get(lastState, path) !== get(nextState, path);
            }).map(nextState => {
                return get(nextState, path);
            });
        },
        filter(filter) {
            const newStream = Stream();
            observers.push((...args) => {
                if (filter(...args))
                    newStream.publish(...args);
            });
            return newStream;
        },
        map(mapper) {
            const newStream = Stream();
            observers.push((v) => {
                newStream.publish(mapper(v));
            })
            return newStream;
        }
    }
}

exports.Stream = Stream;
