'use strict';

const { createMutation } = require('./mutations');

module.exports = function createStage(target, handlers) {
    const _createStage = (o, path = []) => {
        const getTarget = () => typeof o == 'function'? o(): o;
        const proxy = new Proxy(getTarget(), {
            get: (nonUsedProxyTarget, name) => {
                // transmutable.target can change
                // so we want to have always the current target
                const target = getTarget();
                const value = target[name];
                if (value && typeof value == 'object') {
                    return _createStage(value, path.concat(name));
                }
                if (typeof value == 'function') {
                    return function (...args) {
                        handlers.set(createMutation(path, undefined, name, args));
                    };
                }
                return value;
            },
            set: (nonUsedProxyTarget, k, v) => {
                const mutPath = [];
                for (let i = 0; i < path.length + 1; i++) {
                    mutPath.push(path[i] || k)
                }
                handlers.set(createMutation(mutPath, v));
                return true;
            }
        });
        return proxy;
    }

    return _createStage(target);
}
