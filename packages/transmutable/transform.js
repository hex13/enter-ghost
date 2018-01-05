'use strict';
const { cloneAndApplyMutations } = require('./cloning');
const evaluateMutations = require('./evaluateMutations');

const Transform = (transformer) => {
    const run = (state, ...args) => {
        const mutations = evaluateMutations(state, transformer, ...args);
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
    transform.run = run;
    return transform;
}

exports.transform = (transformer, original) => {
    if (typeof transformer !== 'function') throw new Error(`
        API was changed in 0.5.0 version of Transmutable library.
        Now transform function takes transforming function as a FIRST argument.
        Original state as a SECOND one.
    `);
    return Transform(transformer)(original);
}

exports.Transform = Transform;

// we keep Reducer separately because Reducer is meant for use with Redux
// and Transform is for general use.
// now they both share the same API and implementation
// but in future versions it may not be true
exports.Reducer = Transform;
