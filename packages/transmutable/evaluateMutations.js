'use strict';
const createStage = require('./createStage');

module.exports = (lastState, transformer) => {
    const mutations = [];
    const stage = createStage(() => lastState, {
        set: (mutation) => {
            mutations.push(mutation);
        },
    });
    transformer(stage);
    return mutations;
};
