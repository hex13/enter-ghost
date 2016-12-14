const assert = require('assert');

const {createIpc} = require('../ipc');
const {fork} = require('child_process');
const Path = require('path');


describe('Ipc', () => {
    it('should proxy', (done) => {
        const cp = fork(Path.join(__dirname, '../exampleChildProcess.js'), {
            stdio: [0, 1, 2, 'ipc'],
            silent: true,
        });
        const ipc = createIpc(cp, d => {
            assert.deepEqual(d, {
                type: 'request',
                name: 'foo',
                args: [1, 2]
            });
            ipc.request('sum', 2, 5).then(v => {
                assert.equal(v, 7);
            })
            .then(() => {
                ipc.dispatch({
                    type: 'request',
                    name: 'foo',
                    args: [10, 20]
                }).then(response => {
                    assert.equal(response, 30);
                    done();
                });
            })
            .catch(done);
        });

    });
});
