'use strict';
const createStage = require('./createStage');

module.exports = (lastState, transformer, ...args) => {
    const mutations = [];
    const stage = createStage(() => lastState, {
        set: (mutation) => {
            mutations.push(mutation);
        },
    });
    transformer(stage, ...args);
    return mutations;
};
