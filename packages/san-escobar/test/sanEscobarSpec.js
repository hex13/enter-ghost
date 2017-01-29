const SE = require('..');

describe('San Escobar', () => {
    it('should not throw error', () => {
        const se = SE(SE.htmlLogger);
        const proxied = se.spy({a: 1, b: () => {}});
        proxied.a; // get
        proxied.a = 123; // set
        proxied.b(); // call
    });
});
