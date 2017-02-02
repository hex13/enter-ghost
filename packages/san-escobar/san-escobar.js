"use strict";

const { sic } = require('./printObject');

const TraceMachine = require('trace-machine');
const { EventEmitter } = require('events');



const writeToConsole = (s) => console.log(s);


const writeToDom = (s) => {
    const el = document.body;
    el.innerHTML += s;
};
const write = writeToConsole;
const consoleLogger = {emit: console.log.bind(console)};


const htmlLogger = require('./htmlLogger')({
    write
});

const jsonLogger = require('./jsonLogger')({
    prefix: 'san escobar: ',
    write
});


const instancesByLogger = new WeakMap;
function SanEscobar(logger = consoleLogger) {
    let inst = instancesByLogger.get(logger);
    if (inst) return inst;
    const { spy } = TraceMachine({
        logger
    });

    inst = {
        spy,
        log(...args) {
            logger.emit('info', {
                messages: args.map(
                    arg => typeof arg == 'string'? sic(arg) : arg
                )
            })
        }
    }
    instancesByLogger.set(logger, inst);
    return inst;
};

module.exports = SanEscobar;
module.exports.consoleLogger = consoleLogger;
module.exports.jsonLogger = jsonLogger;
module.exports.htmlLogger = htmlLogger;
