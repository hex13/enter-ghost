const assert = require('assert');

const events = [
    {type: 'func', name: 'foo'},
    {type: 'func', name: 'bar'}
];

const replay = require('../replay');
describe('replay', () => {
    it('should replay', (done) => {
        replay(events, (api) => {
            assert(api.state);
            assert(api.write);
            assert(api.stringify);

            let c = 0;
            return {
                func() {
                    c++;
                    if (c >= 2) done();
                }
            };
        })
    });
});
