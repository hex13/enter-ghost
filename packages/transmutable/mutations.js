'use strict';

function getMutationPath(mutation) {
    return mutation.path;
}

function getMutationValue(mutation) {
    return mutation.value;
}

function createMutation(path, value, type, args) {
    if (type) {
        return {type, path, value, args};
    }
    return {type: 'set', path, value};
}

function getMutationType(mutation) {
    return mutation.type;
}

function getMutationArgs(mutation) {
    return mutation.args;
}

module.exports = {
    getMutationPath, getMutationValue, createMutation, getMutationType, getMutationArgs
}
