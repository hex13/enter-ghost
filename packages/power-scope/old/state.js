"use strict";
const { unknown } = require('./symbols');
const EventEmitter = require('events');
module.exports = function createState() {
    const ee = new EventEmitter;
    const state = {
        expr: [{value: unknown}],
        objects: [],
        scopes: [],
        values: [],
        functions: [],
        chains: [],
        vars: [],
        result: {
            scopes: [],
            requires: [],
            imports: [],
        },
        emit: (...args) => ee.emit(...args),
        on: (...args) => ee.on(...args),
    };
    ee.on('require', args => {
        state.result.requires.push(args[0]);
    });
    ee.on('import', args => {
        state.result.imports.push(args[0]);
    })

    return state;
}
