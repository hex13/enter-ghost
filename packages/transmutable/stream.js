'use strict';
const { get } = require('./get-set');

function Stream() {
    const observers = [];
    return {
        publish(...args) {
            observers.forEach(o => o(...args));
        },
        subscribe(observer, path) {
            // TODO this should not go in here, because it's opinionated
            // not every stream will carry state.
            observers.push((nextState, lastState) => {
                if (get(lastState, path) !== get(nextState, path))
                    observer(get(nextState, path))
            });
        },
        map(mapper) {
            const mappedStream = Stream();
            observers.push((v) => {
                mappedStream.publish(mapper(v));
            })
            return mappedStream;
        }
    }
}

exports.Stream = Stream;
