const events = [];

const emit = (type, payload = {}) => {
    events.push(Object.assign({type}, payload));
};


exports.ret = (value) => {
    emit('ret', {value});
    return value;
};

exports.func = (name, ...args) => {
    emit('func', {name, args});

};

// exports.filter = (name) => {
// TODO maybe filter as an event? filter could change in time...
//     state.filter = name; // this is from old version of script.
// };

//exports.log = log;

exports.getEvents = () => events;

setTimeout(() => {
    const s = JSON.stringify({
        type: 'enterGhostDebugEvents',
        events
    });

    if (global.EVENTS_PATH) {
        require('fs').writeFileSync('events.events', s);
    }
}, 300);
require('./replay')(events, require('./htmlVisitor'));
