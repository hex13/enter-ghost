'use strict';
const { cloneAndApplyMutations } = require('./cloning');
const createStage = require('./createStage');

module.exports = (original, transformer) => {
    const mutations = [];
    const stage = createStage(() => original, {
        set: (path, v) => {
            mutations.push([path, v]);
        }
    });
    transformer(stage);
    return cloneAndApplyMutations(original, mutations);
};
