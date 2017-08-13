"use strict";


function set(target, path, value) {
  let curr = target, i;
  for (i = 0; i < path.length - 1; curr = curr[path[i++]]) ;
  curr[path[i]] = value
}

function get(target, path) {
  let curr = target, i;
  for (i = 0; i < path.length - 1; curr = curr[path[i++]]) ;
  if (curr) return curr[path[i]];
}

function isDirty(mutations, propPath, target) {
    for (let i = 0; i < mutations.length; i++) {
        const mutPath = mutations[i][0];
        const mutValue = mutations[i][1];
        const minLen = Math.min(mutPath.length, propPath.length);
        let affectedByMutation = true;
        for (let j = 0; j < minLen; j++) {
            const mutPropName = mutPath[j];
            const searchedPropName = propPath[j];
            if (mutPropName !== searchedPropName) {
                affectedByMutation = false;
                break;
            }
        }
        if (affectedByMutation) {
            if (get(target, mutPath) !== mutValue) return true;
        }

    }
    return false;
}

function cloneDeepWithDirtyChecking(o, mutations) {

    const copy = (o, objPath = []) => {
        if (!isDirty(mutations, objPath, o)) return o;
        let o2;
        if (Array.isArray(o)) {
            o2 = o.slice();
        } else o2 = {};

        // NOTE currently we're doing for...in also for arrays (is this correct?)

        for (let k in o) {
            if (o[k] && typeof o[k] =='object') {
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
    this.target = o;

    const createStage = (o, path = []) => {
        const getTarget = () => typeof o == 'function'? o(): o;
        const proxy = new Proxy(getTarget(), {
            get: (nonUsedProxyTarget, name) => {
                // transmutable.target can change
                // so we want to have always the current target
                const target = getTarget();

                if (target[name] && typeof target[name] == 'object') {
                    return createStage(target[name], path.concat(name));
                }
                return target[name];
            },
            set: (nonUsedProxyTarget, k, v) => {
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

    this.stage = createStage(() => this.target);
}

Transmutable.prototype.pushTo = function pushTo(target) {
    const proposed = this;
    for (let i = 0; i < proposed.mutations.length; i++) {
        const m = proposed.mutations[i];;
        if (!m) break;
        const [path, value] = m;
        set(target, path, value);
    }
};


Transmutable.prototype.commit = function commit() {
    const copied = this.reify();
    this.target = copied;
    this.mutations.length = 0;
    return copied;
}

Transmutable.prototype.reify = function reify(target) {
    const copied = cloneDeepWithDirtyChecking(this.target, this.mutations);
    this.pushTo(copied);
    return copied;
};

exports.Transmutable = Transmutable;

exports.transform = (original, transformer) => {
    const t = new Transmutable(original);
    transformer(t.stage);
    return t.reify();
};
