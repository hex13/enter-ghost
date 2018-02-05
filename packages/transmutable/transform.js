'use strict';

const { MUTATION, WAS_WRITTEN, WAS_ACCESSED, ENTITY, ENTITIES } = require('./symbols');
const { get, set } = require('./get-set');





function createStage(target, rootPatch, keys = []) {
    return new Proxy(target, {
        get(target, name) {

            let value;
            const mutation = get(rootPatch, keys.concat([name, MUTATION]));

            if (mutation) {
                return mutation.value;
            }
            else
                value = target[name];

            if (value && typeof value == 'object') {
                return createStage(value, rootPatch, keys.concat(name));
            }

            return value;
        },
        set(target, name, value) {
            let patch = get(rootPatch, keys);
            if (!patch) {
                patch = {};
                set(rootPatch, keys, patch);
            }
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
                set(rootPatch, keys.concat(name), {[MUTATION]:{value}})
            }

            return true;
        },
        ownKeys(target) {
            const patch = get(rootPatch, keys.concat([])) || {}
            return Array.from(new Set(
                Reflect.ownKeys(target).concat(Object.keys(patch))
            ));
        },
        getOwnPropertyDescriptor(target, name) {
            const patch = get(rootPatch, keys) || {};
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

function applyPatch (node, patch, root, rootPatch) {
    if (patch && patch[MUTATION]) {
        const mutValue = patch[MUTATION].value;
        if (mutValue && mutValue[ENTITY]) {
            const id = mutValue[ENTITY];
            if (rootPatch[ENTITIES] && rootPatch[ENTITIES] && rootPatch[ENTITIES][id]) {
                return rootPatch[ENTITIES][id][MUTATION].value;
            }
            return root[ENTITIES][mutValue[ENTITY]];
        }
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
            const res = applyPatch(node[k], patch[k], root, rootPatch);
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
        result = transformer.call(copy, copy, ...args);
        patch = diff(original, copy);
    } else {
        patch = {};
        const stage = createStage(original, patch);
        result = transformer.call(stage, stage, ...args);
    }
    if (typeof result != 'undefined') return result;
    return applyPatch(original, patch, original, patch);

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
        const relativeStage = get(d, getter);
        const result = setter.call(relativeStage, relativeStage);
        if (typeof result != 'undefined') {
            set(d, getter, result)
        }
    }, original);
}
exports.over = over;
exports.transformAt = over;
