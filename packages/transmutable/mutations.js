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

function getMutationType(mutation) {
    return mutation.type;
}

module.exports = {
    getMutationPath, getMutationValue, createMutation, getMutationType
}
