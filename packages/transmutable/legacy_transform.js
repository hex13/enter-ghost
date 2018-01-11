// TODO rewrite to use the new implementation
const IS_TRANSFORM = Symbol();
const evaluateMutations = require('./evaluateMutations');

const { cloneAndApplyMutations } = require('./cloning');
const Transform = (transformer) => {
    if (transformer[IS_TRANSFORM]) return transformer;

    const run = (state, ...args) => {
        const mutations = evaluateMutations(transformer, state, ...args);
        return {
            // TODO this seems to be not tested:
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

exports.Transform = Transform;
