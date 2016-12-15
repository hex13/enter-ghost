const {fork} = require('child_process');
const Path = require('path');
const {createIpc} = require('../vifi-proxy/ipc');

const createChildProcess = (app) => {
    const opts = {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'], silent: true
    };
    const serviceConfigPath = Path.join(__dirname, './services.json');
    const cp = fork(Path.join(__dirname, './serviceProcess'), [serviceConfigPath], opts);

    cp.stdout.on('data', d => {
        console.log("CHILD PROCESS--", d+'');
    });
    cp.stderr.on('data', d => {
        console.warn('Error in child process', d+'');
    });

    // for debugging
    // cp.on('message', d => {
    //     console.warn('message', d);
    // });
    return cp;
}


const iterateServices = (path, each) => {
    const ext = require(path)();
    Object.keys(ext.services).forEach(name => {
        each({name, service: ext.services[name]});
    });
};

module.exports = (app) => {

    const cp = createChildProcess(app);
    const ipc = createIpc(cp, (msg) => {

    });

    ['lint', 'vcs'].forEach( name => {
        app.vifi.service(name, (file) => {
            return file.read().then(contents => {
                const result = ipc.request(name, { path: file.path, contents });
                return result;

            })

        });
    });

};
