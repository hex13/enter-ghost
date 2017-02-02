"use strict";

const { sic } = require('./printObject');

const TraceMachine = require('trace-machine');
const { EventEmitter } = require('events');



const writeToConsole = (s) => console.log(s);

const createDomOutput = el => (s) => {
    let match;
//    const script = s.match(/<script>([.\s\S]*?)<\/script>/);
    const scripts = [];
    s = s.replace(/<script>([.\s\S]*?)<\/script>/, (match, scriptContents) => {
        scripts.push(scriptContents);
        return '';
    });
    scripts.forEach(scriptContents => {
        console.warn("SCRIPT included", scriptContents);
        const script = document.createElement('script');
        script.innerHTML = scriptContents;
        document.body.appendChild(script);
    })
    if (false && match == s.match(/.*<script>(.*?)<\/script>/)) {
        // injecting
        console.log("MMM",match)
        el.innerHTML += match[1];
    } else {
        el.innerHTML += s;
    }
};

let _write;
const write = (s) => {
    if (_write)
        _write(s);
    else
        writeToConsole(s);
}
const consoleLogger = {emit: console.log.bind(console)};


const htmlLogger = require('./htmlLogger')({
    write
});

const jsonLogger = require('./jsonLogger')({
    prefix: 'san escobar: ',
    write
});


const instancesByLogger = new WeakMap;
function SanEscobar(logger = consoleLogger, write) {
    _write = write;
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
module.exports.createDomOutput = createDomOutput;
