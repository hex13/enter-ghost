const { EventEmitter } = require('events');

const { sic, printObject } = require('./printObject');
const initialStyleTag = require('./initialStyleTag');
const initialScriptTag = require('./initialScriptTag');


module.exports = function createHtmlLogger({write}) {
    function print(...objects) {
        const s = objects.map(printObject).join(' ');
        write(`<li class="event">${s}</li>`);
    }

    function printNS(ns, ...objects) {
        print(sic(`<span class="${ns}">${ns}</span>`), ...objects);
    }

    const htmlLogger = new EventEmitter;
    let initialized = false;

    htmlLogger.on('init', function () {
        if (initialized) {
            return;
            //throw new Error('logger was already initialized');

        }
        initialized = true;
        write(initialStyleTag + initialScriptTag);
    });

    htmlLogger.on('call', payload => {
        const args = payload.args.map(printObject).join(', ');
        write(`<li class="event"><span class="call">call</span> ${payload.name}(${args})<ul>`);
    });

    htmlLogger.on('ret', payload => {
        write(`</ul><span class="ret">ret</span> => ${printObject(payload.value)}</li>`);
    });

    htmlLogger.on('get', payload => {
        printNS('get', sic(payload.name), sic('=>'), payload.value);
    });

    htmlLogger.on('set', payload => {
        printNS('set', sic(payload.name), sic(':='), payload.value);
    });

    htmlLogger.on('new', payload => {
        printNS('new', sic(payload.name));
    });

    htmlLogger.on('resolve', payload => {
        printNS('resolve', sic(payload.name), payload.value);
    });

    htmlLogger.on('info', payload => {
        print(...payload.messages);
    });


    return htmlLogger;
}
