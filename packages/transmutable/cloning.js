'use strict';

const { get, set } = require('./get-set');

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
            return true;
        }

    }
    return false;
}

function applyChanges(target, mutations) {
    for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];;
        if (!m) break;
        const [path, value] = m;
        set(target, path, value);
    }
};

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


function computeChanges(sourceObject, mutations) {
    return mutations.filter(([mutPath, mutValue]) => {
        return get(sourceObject, mutPath) !== mutValue;
    });
}

function cloneAndApplyMutations(sourceObject, mutations) {
    const changes = computeChanges(sourceObject, mutations);
    const nextValue = cloneDeepWithDirtyChecking(sourceObject, changes);
    applyChanges(nextValue, changes);
    return nextValue;
}
exports.cloneAndApplyMutations = cloneAndApplyMutations;

exports.applyChanges = applyChanges;
