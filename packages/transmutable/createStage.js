'use strict';

module.exports = function createStage(target, handlers) {
    const _createStage = (o, path = []) => {
        const getTarget = () => typeof o == 'function'? o(): o;
        const proxy = new Proxy(getTarget(), {
            get: (nonUsedProxyTarget, name) => {
                // transmutable.target can change
                // so we want to have always the current target
                const target = getTarget();

                if (target[name] && typeof target[name] == 'object') {
                    return _createStage(target[name], path.concat(name));
                }
                return target[name];
            },
            set: (nonUsedProxyTarget, k, v) => {
                const mutPath = [];
                for (let i = 0; i < path.length + 1; i++) {
                    mutPath.push(path[i] || k)
                }
                handlers.set(mutPath, v);
                return true;
            }
        });
        return proxy;
    }

    return _createStage(target);
}
