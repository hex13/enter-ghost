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

exports.transform = (original, transformer) => {
    return Transform(transformer).run(original).reify();
}

exports.Transform = Transform;

// we keep Reducer separately because Reducer is meant for use with Redux
// and Transform is for general use.
// now they both share the same API and implementation
// but in future versions it may not be true
exports.Reducer = Transform;
