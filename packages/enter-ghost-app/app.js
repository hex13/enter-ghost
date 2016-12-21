const EventEmitter =  require('events');

const ghost = require('vifi');

module.exports = () => {
    const app = new EventEmitter;
    app.createEmitter = () => {
        const ee = new EventEmitter
        return ee;
    };
    app.vifi = ghost;

    const variables = new Map;
    app.get = (key) => {
        return variables.get(key);
    }
    app.set = (key, data) => {
        variables.set(key, data);
        app.emit('set', key, data);
    }

    return app;
};
