'use strict';

const { get, set } = require('./get-set');

const WAS_WRITTEN = Symbol();
const METHOD = Symbol();

const { getMutationPath, getMutationValue, getMutationType, getMutationArgs } = require('./mutations');

function callComputation(target, m) {
    return get(target, getMutationPath(m))[getMutationType(m)](...getMutationArgs(m));
}


function findLastComputation(mutations, value, indexLesserThan) {
    for (let i = indexLesserThan - 1; i >= 0; i--) {
        if (getMutationValue(mutations[i]) === value) {
            return mutations[i];
        }
    }
}


function applyChanges(target, mutations) {
    for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];;
        if (!m) break;
        const type = getMutationType(m);
        const value = getMutationValue(m);
        const path = getMutationPath(m);

        switch (type) {
            case 'set':
                if (typeof value == 'symbol') {
                    const v = callComputation(target, findLastComputation(mutations, value, i));
                    set(target, path, v);
                    break;
                }
                set(target, path, value);
                break;
            default:
                callComputation(target, m);
        }
    }
};


function cloneDeepWithDirtyChecking(o, mutations, treeOfChanges) {

    const copy = (o, currentChanges) => {
        if (!currentChanges || (Object.keys(currentChanges).length == 0 && !currentChanges[METHOD] )) return o;
        if (Array.isArray(o)) {
            return o.map((item, i) => {
                return copy(item, currentChanges[i]);
            })
        }
        const o2 = {};
        for (let k in o) {
            o2[k] = copy(o[k], currentChanges? currentChanges[k] : undefined);
        }
        return o2;
    }
    return copy(o, treeOfChanges);
}


function computeChanges(sourceObject, mutations) {
    const changes = [];
    const treeOfChanges = {};

    for (let i = mutations.length - 1; i >= 0; i--) {
        const mutPath = getMutationPath(mutations[i]);
        const mutValue = getMutationValue(mutations[i]);
        const wasWrittenRef = mutPath.concat(WAS_WRITTEN);
        if (
            getMutationType(mutations[i]) != 'set'
            || get(sourceObject, mutPath) !== mutValue
            && get(treeOfChanges, wasWrittenRef) !== true
        ) {
            changes.unshift(mutations[i]);
            if (getMutationType(mutations[i]) === 'set')
                set(treeOfChanges, wasWrittenRef, true);
            else
                set(treeOfChanges,mutPath.concat( METHOD), true);
        }
    }

    return {tree: treeOfChanges, array: changes};
}

function cloneAndApplyMutations(sourceObject, mutations, handlers = {}) {
    const changes = computeChanges(sourceObject, mutations);
    if (handlers.onComputeChanges) handlers.onComputeChanges(changes);
    const nextValue = cloneDeepWithDirtyChecking(sourceObject, changes.array, changes.tree);
    applyChanges(nextValue, changes.array);
    return nextValue;
}
exports.cloneAndApplyMutations = cloneAndApplyMutations;

exports.applyChanges = applyChanges;
