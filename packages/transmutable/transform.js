'use strict';

const { MUTATION, WAS_WRITTEN, WAS_ACCESSED} = require('./symbols');
const { get, set } = require('./get-set');

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
        },
        ownKeys(target) {
            return Array.from(new Set(
                Reflect.ownKeys(target).concat(Object.keys(patch))
            ));
        },
        getOwnPropertyDescriptor(target, name) {
            if (patch[name] &&  patch[name][MUTATION]) {
                return {
                    configurable: true,
                    enumerable: true,
                    value: patch[name][MUTATION].value
                }
            }
            return Reflect.getOwnPropertyDescriptor(target, name);
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
        //&& patch[WAS_ACCESSED]
        && Object.keys(patch).length
    ) {
        let copy;

        if (Array.isArray(node))
            copy = node.slice();
        else {
            copy = {};
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

const diff = require('./diff');
const copyDeep = require('./copyDeep');

const transform = (transformer, original, ...args) => {
    if (typeof original == 'undefined') {
        return transform.bind(null, transformer);
    }
    if (typeof transformer !== 'function') throw new Error(`
        API was changed in 0.5.0 version of Transmutable library.
        Now transform function takes transforming function as a FIRST argument.
        Original state as a SECOND one.
    `);

    let patch;
    let result;
    if (typeof Proxy == 'undefined') {
        const copy = copyDeep(original);
        result = transformer(copy, ...args);
        patch = diff(original, copy);
    } else {
        patch = {};
        result = transformer(createStage(original, patch), ...args);
    }
    if (typeof result != 'undefined') return result;
    return applyPatch(original, patch);

}
exports.transform = transform;


// we keep Reducer separately because Reducer is meant for use with Redux
// and Transform is for general use.
// now they both share the same API and implementation
// but in future versions it may not be true
exports.Reducer = () => {
    throw new Error("Transmutable: to create Redux reducer just use `transform` function with currying (look into docs)")
}

const over = (getter, setter, original) => {
    if (typeof setter == 'undefined') return over.bind(null, getter);
    return transform(d => {
        const result = setter(get(d, getter));
        if (typeof result != 'undefined') {
            set(d, getter, result)
        }
    }, original);
}
exports.over = over;
exports.transformAt = over;
