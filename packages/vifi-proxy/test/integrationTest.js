const assert = require('assert');

const {createIpc} = require('../ipc');
const {fork} = require('child_process');
const Path = require('path');

const {createEmitter} = require('../calls2messages');

describe('these few modules', () => {
    it('should work together', (done) => {
        const cp = fork(Path.join(__dirname, '../exampleChildProcess.js'), {
            stdio: [0, 1, 2, 'ipc'],
            silent: true,
        });

        const ipc = createIpc(cp, receive => {

        });

        const emitter = createEmitter(msg => ipc.dispatch(msg));
        emitter.foo(1, 3).then(v => {
            assert.equal(v, 4)
            done();
        }).catch(done);
        // const ipc = createIpc(cp, d => {
        // });
    });
});
