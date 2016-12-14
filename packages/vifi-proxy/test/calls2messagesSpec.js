const assert = require('assert');


const {createEmitter} = require('../calls2messages');

describe('Calls2messages', () => {
    it('should emit messages', done => {
        const emitter = createEmitter(d => {
            assert.deepEqual(d, {
                type: 'request',
                name: 'foo',
                args: [1, 2, 3]
            });
            return d.args[0] + d.args[1] + d.args[2];
        }, {
            bar: () => 'bar1'
        });

        let result;

        result = emitter.foo(1, 2, 3);
        assert.equal(result, 6);

        result = emitter.bar();
        assert.equal(result, 'bar1');

        done();
    });
});
