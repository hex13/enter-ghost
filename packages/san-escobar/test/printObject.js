const assert = require('assert');
const { printObject } = require('../printObject');

describe('printObject', () => {
    it('should pass without error', () => {
        const o = {
            n: 123,
            m: 11,
            s: 'kotek',
            b: true,
            f: false,
            none: null,
            sub: {

            }
        };
        o.sub.cycle = o;
        assert(printObject(o));
    });
});
