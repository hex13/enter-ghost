const { EventEmitter } = require('events');
const stringify = require('json-stringify-safe');

module.exports = function createJsonLogger({prefix='000', write}) {
    //const logger = new EventEmitter;
    const logger = {
        emit(type, payload) {
            const json = stringify([type, payload]);
            console.log(prefix, json);
        }
    };

    //logger.on('')

    return logger;
}
