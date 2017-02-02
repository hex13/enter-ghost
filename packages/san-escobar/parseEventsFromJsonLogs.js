"use strict";

module.exports = (input, prefix='') => {
    return input
        .split('\n')
        .filter(line => line.match(prefix))
        .map(line => line.replace(prefix, ''))
        .map(line => line.trim())
        .filter(line => line) // remove empty lines
        .map(line => JSON.parse(line)); // remove empty lines
};
