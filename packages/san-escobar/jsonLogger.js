const { EventEmitter } = require('events');
const stringify = require('json-stringify-safe');

module.exports = function createJsonLogger({write}) {
    //const logger = new EventEmitter;
    const logger = {
        emit(type, payload) {
            const json = stringify([type, payload]);
            console.log(json);
        }
    };

    //logger.on('')

    return logger;
}
