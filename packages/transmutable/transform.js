'use strict';
const { cloneAndApplyMutations } = require('./cloning');
const evaluateMutations = require('./evaluateMutations');
const IS_TRANSFORM = Symbol();

// TODO rewrite to use the new implementation
const Transform = (transformer) => {
    if (transformer[IS_TRANSFORM]) return transformer;

    const run = (state, ...args) => {
        const mutations = evaluateMutations(transformer, state, ...args);
        return {
            reify: () => cloneAndApplyMutations(
                state,
                mutations
            ),
            mutations,
        }
    }
    const transform = (...args) => {
        return run(...args).reify();
    };
    transform[IS_TRANSFORM] = true;
    transform.run = run;
    return transform;
}


const { MUTATION, WAS_WRITTEN, WAS_ACCESSED} = require('./symbols');

function ensurePatch(parentPatch, propName) {
    let deeperPatch = parentPatch[propName];

    if (!deeperPatch) {
        deeperPatch = parentPatch[propName] = {};
        parentPatch[WAS_ACCESSED] = true;
    }

    return deeperPatch;
}

function createStage(target, patch) {
    return new Proxy(target, {
        get(target, name) {
            let value;
            const mutation = patch[name] && patch[name][MUTATION];

            if (mutation) {
                return mutation.value;
            }
            else
                value = target[name];

            if (value && typeof value == 'object') {
                return createStage(value, ensurePatch(patch, name));
            }

            return value;
        },
        set(target, name, value) {
            const oldValue = target[name];

            if (value !== oldValue) {
                if (Array.isArray(target)) {
                    if (!patch[MUTATION]) {
                        const arrayDraft = target.slice();
                        // we need to explicitly assign the first changed item
                        // all next changes will affect arrayDraft directly
                        // without Proxy (`get` trap will return patch[MUTATION].value)
                        arrayDraft[name] = value;
                        patch[MUTATION] = {value: arrayDraft};
                    }
                    return true;
                }
                let deeperPatch = ensurePatch(patch, name);
                deeperPatch[MUTATION] = {value}
            }

            return true;
        }
    });
}

function applyPatch (node, patch) {
    if (patch && patch[MUTATION]) {
        return patch[MUTATION].value;
    }

    if (
        patch
        && node && typeof node == 'object'
        && patch[WAS_ACCESSED]
        //&& Object.keys(patch).length
    ) {
        const isArray = Array.isArray(node);

        let copy;

        if (isArray)
            copy = node.slice();
        else {
            copy = {};
        }

        if (!isArray) {
            for (let k in node) {
                copy[k] = node[k];
            }
        }

        for (let k in patch) {
            const res = applyPatch(node[k], patch[k]);
            copy[k] = res;
        }

        return copy;
    }

    return node;
}

exports.applyPatch = applyPatch;

const transform = (transformer, original, ...args) => {
    if (typeof original == 'undefined') {
        return transform.bind(null, transformer);
    }
    if (typeof transformer !== 'function') throw new Error(`
        API was changed in 0.5.0 version of Transmutable library.
        Now transform function takes transforming function as a FIRST argument.
        Original state as a SECOND one.
    `);
    const patch = {};
    transformer(createStage(original, patch), ...args);
    return applyPatch(original, patch);

    //return Transform(transformer)(original);
}
exports.transform = transform;
exports.Transform = Transform;

// we keep Reducer separately because Reducer is meant for use with Redux
// and Transform is for general use.
// now they both share the same API and implementation
// but in future versions it may not be true
exports.Reducer = Transform;
