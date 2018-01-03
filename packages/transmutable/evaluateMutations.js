'use strict';
const createStage = require('./createStage');

module.exports = (lastState, transformer) => {
    const mutations = [];
    const stage = createStage(() => lastState, {
        set: (path, v) => {
            mutations.push([path, v]);
        }
    });
    transformer(stage);
    return mutations;
};
