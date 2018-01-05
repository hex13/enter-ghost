const assert = require('assert');
const { Transmutable } = require('../transmutable');
const { Transform } = require('../transform');
const { Stream } = require('../stream');
const { Hub } = require('../mea');
describe('mea', () => {
    it('should call a store', (done) => {
        const store = new Transmutable({val: 0});

        let count = 0;
        let signalsToSend = [
            {type: 'inc', },
            {type: 'inc', },
            {type: 'inc', },
            {type: 'mul', amount: 2, },
            {type: 'inc' },
        ]
        store.observe((state) => {
            count++;

            if (count >= signalsToSend.length) {
                assert.deepStrictEqual(state, {val: 7})
                done();
            }
        });

        function someService(input) {
            const output = Stream();
            input.subscribe((signal) => {

                let transform;
                switch (signal.type) {
                    case 'inc':
                        transform = Transform(state => {
                            state.val++;
                        });
                        break;
                    case 'mul':
                        transform = Transform(state => {
                            state.val *= signal.amount;
                        });
                        break;
                }

                output.publish(transform)
            });

            return output;
        }

        const hub = Hub(store);
        hub.addService(someService);

        signalsToSend.forEach(signal => {
            hub.input.publish(signal);
        })
    });
});
