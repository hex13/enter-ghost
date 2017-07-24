"use strict";

function isDirty(mutations, propPath) {
    for (let i = 0; i < mutations.length; i++) {
        const mutPath = mutations[i][0];
        const minLen = Math.min(mutPath.length, propPath.length);
        let changed = true;
        for (let j = 0; j < minLen; j++) {
            const mutPropName = mutPath[j];
            const searchedPropName = propPath[j];
            if (mutPropName !== searchedPropName) {
                changed = false;
                break;
            }
        }
        if (changed) return true;

    }
    return false;
}

function cloneDeepWithDirtyChecking(o, mutations) {

    const copy = (o, objPath = []) => {
        if (!isDirty(mutations, objPath)) return o;

        const o2 = {};
        for (let k in o) {
            if (typeof o[k] =='object') {
                const propPath = new Array(objPath.length + 1);
                for (let i = 0; i < objPath.length; i++) {
                    propPath[i] = objPath[i];
                }
                propPath[objPath.length] = k;

                o2[k] = copy(o[k], propPath);
            } else {
                o2[k] = o[k];
            }
        }
        return o2;
    }
    return copy(o);
}


function Transmutable(o) {
    this.mutations = [];
    const createStage = (o, path = []) => {

        const keys = Object.keys(o);

        const proxy = new Proxy(o, {
            get: (target, name) => {
                if (typeof target[name] == 'object') {
                    return createStage(target[name], path.concat(name));
                }
                return target[name];
            },
            set: (target, k, v) => {
                const mutPath = [];
                for (let i = 0; i < path.length + 1; i++) {
                    mutPath.push(path[i] || k)
                }
                this.mutations.push([mutPath, v])
                return true;
            }
        });
        return proxy;
    }
    this.stage = createStage(o);
    this.target = o;
}

Transmutable.prototype.pushTo = function pushTo(target) {
    const proposed = this;
    for (let i = 0; i < proposed.mutations.length; i++) {
        const m = proposed.mutations[i];;
        if (!m) break;
        const [path, value] = m;

        let curr;
        for (let j = 0, curr = target; j < path.length; j++) {
            if (j < path.length - 1) {
                curr = curr[path[j]];
            } else {
                curr[path[j]] = value
            }
        }
    }
    this.mutations.length = 0;
};


Transmutable.prototype.commit = function commit() {
    const copied = cloneDeepWithDirtyChecking(this.target, this.mutations);
    this.pushTo(copied);
    return copied;
}

exports.transmutable = () => {
    return {
        fork(original) {
            return new Transmutable(original)
        }
    }
};
