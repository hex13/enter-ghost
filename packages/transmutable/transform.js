'use strict';
const { cloneAndApplyMutations } = require('./cloning');
const evaluateMutations = require('./evaluateMutations');

module.exports = (original, transformer) => (
    cloneAndApplyMutations(original, evaluateMutations(original, transformer))
)
