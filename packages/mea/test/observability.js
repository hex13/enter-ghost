'use strict';

const assert = require('assert');

const { createExample } = require('transmutable/testUtils');
const { State } = require('../state');
const { AUTO } = require('transmutable/symbols');

describe('observability', () => {

    let t, ex, expected, original;
    beforeEach(() => {
        ex = createExample();
        original = ex;
        t = new State(ex);
        expected = createExample();
    });

    it('doesn\'t trigger observers if there are no mutations', () => {
        let c = 0;
        t.observe(() => {
            c++;
        });
        assert.strictEqual(c, 0);
        t.run(d => {

        });
        assert.strictEqual(c, 0);
    });

    it('allows for observing changes after commit (in whole object)', () => {
        let c = 0;
        t.observe(() => {
            c++;
        });
        assert.strictEqual(c, 0);
        t.run(state => {
            state.a = 292828;
        });
        assert.strictEqual(c, 1);

        t.run(state => {
            state.a = 74342;
        })
        assert.strictEqual(c, 2);
    });

    it('allows for attaching few observers at once', () => {
        let c1 = 0, c2 = 0;
        t.observe(() => {
            c1++;
        });
        t.observe(() => {
            c2++;
        });
        t.run(state => {
            state.a = 381211;
        })
        assert.strictEqual(c1, 1);
        assert.strictEqual(c2, 1);
    });

    it('passes state to observer (when subscribing to full state)', () => {
        let c = 0;
        expected.observable.foo.cat = 981198;

        t.observe((state) => {
            assert.deepStrictEqual(state, expected);
            c++;
        });

        t.run(state => {
            state.observable.foo.cat = 981198;
        })
        assert.strictEqual(c, 1);
    });

    it('passes state to observer (when subscribing to path)', () => {
        let c = 0;
        expected.observable.foo.cat = 981198;

        t.select(['observable']).observe((state) => {
            assert.deepStrictEqual(state, expected.observable);
            c++;
        });

        t.run(state => {
            state.observable.foo.cat = 981198;
        })
        assert.strictEqual(c, 1);
    });


    it('allows for observing changes (specific property) #1 array selector', () => {
        let c = 0;
        t.select(['observable', 'foo', 'cat']).observe((state) => {
            assert.strictEqual(state, 981198);
            c++;
        });
        assert.strictEqual(c, 0);
        t.run(state => {
            state.observable.foo.cat = 981198;
        })
        assert.strictEqual(c, 1);
    });

    it('allows for observing changes (specific property) #2 function selector', () => {
        let c = 0;
        t.select(d => d.observable.foo.cat).observe((state) => {
            assert.strictEqual(state, 981198);
            c++;
        });
        assert.strictEqual(c, 0);
        t.run(state => {
            state.observable.foo.cat = 981198;
        })
        assert.strictEqual(c, 1);
    });


    it('allows for observing changes (parent observed, child changed)', () => {
        let c = 0;
        t.select(['observable']).observe(() => {
            c++;
        });
        assert.strictEqual(c, 0);
        t.run(state => {
            state.observable.foo.cat = 981198;
        });
        assert.strictEqual(c, 1);
    });

    it('allows for observing changes (child observed, parent changed)', () => {
        let c = 0;
        t.select(['observable', 'foo', 'cat']).observe(() => {
            c++;
        });
        assert.strictEqual(c, 0);

        t.run(state => {
            state.observable.foo = 981198;
        });

        assert.strictEqual(c, 1);
    });

    it('it triggers handler at most one after one run (even if there are many mutations)', () => {
        let c = 0;
        t.select(['observable', 'foo', 'cat']).observe(() => {
            c++;
        });
        t.run(state => {
            state.observable.foo.cat = 981198;
            state.observable.foo.cat = 282272;
        });
        assert.strictEqual(c, 1);
    });


    it('doesn\'t trigger observer if there is no matching mutation', () => {
        let c = 0;
        t.select(['observable', 'foo', 'cat']).observe(() => {
            c++;
        });

        t.run(state => {
            state.observable.foo.dog = 1234;
        });
        assert.strictEqual(c, 0);
    });

    it('triggers after auto-values', () => {
        let c = 0;

        t.observe((state) => {
            assert.strictEqual(state.qwerty, 1234);
            c++;
        });

        t.run(state => {
            state[AUTO] = {
                qwerty: () => 1234
            };
        });
        assert.strictEqual(c, 1);
    });

});
