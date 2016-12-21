
const Path = require('path');
const fs = require('fs');

//const ext = require('./eslint')();
//const vcs = require('./git')().services.vcs;

const methods = {};
// const methods = {
//     lint(message, file) {
//         const res = ext.services.lint(file);
//         return res;
//     },
//     vcs(message, file) {
//         const res = vcs(file);
//         return res;
//     }
// };

//const config = require('./services');
const config = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
Object.keys(config.services).forEach(k => {
    const modulePath = Path.join(Path.dirname(process.argv[2]), config.services[k]);
    const ext = require(modulePath)();
    methods[k] = (message, file) => {
        const res = ext.services[k](file);
        return res;
    };
});


process.on('message', (event = {}) => {
    const handler = methods[event.name];

    if (handler) {
        const file = event.args[0];
        file.read = () => Promise.resolve(file.contents);

        try {
            handler(event, file).then(result => {
                process.send({type: 'response', id: event.id, value: result});
            }).catch(err => {
                console.error(`Error in '${event.name}' service: `, err);
            });
        } catch (err) {
            console.error(`Error in '${event.name}' service: `, err);
        }
    } else {
        process.send({type: 'error', text: `No service '${event.name}'`});
    }
});
