'use strict';

const { createMutation } = require('./mutations');

module.exports = function createStage(target, handlers) {
    //const proxies = new WeakMap;
    const _createStage = (o, path = []) => {
        const getTarget = () => typeof o == 'function'? o(): o;
        const proxy = new Proxy(getTarget(), {
            get: (nonUsedProxyTarget, name) => {
                // transmutable.target can change
                // so we want to have always the current target
                const target = getTarget();

                const value = target[name];
                // const proxy = proxies.get(value);
                // if (proxy) return proxy;

                if (value && typeof value == 'object') {

                    return _createStage(value, path.concat(name));
                }
                if (typeof value == 'function') {
                    return function (...args) {
                        const abstractValue = Symbol(Math.random());
                        handlers.set(createMutation(path, abstractValue, name, args));
                        return abstractValue;
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
        //const target = getTarget();

    //    proxies.set(getTarget(), proxy);
        return proxy;
    }

    return _createStage(target);
}
