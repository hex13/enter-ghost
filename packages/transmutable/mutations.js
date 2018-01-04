'use strict';

function getMutationPath(mutation) {
    return mutation.path;
}

function getMutationValue(mutation) {
    return mutation.value;
}

function createMutation(path, value, type, ...args) {
    return {type: 'set', path, value};
}

module.exports = {
    getMutationPath, getMutationValue, createMutation
}
