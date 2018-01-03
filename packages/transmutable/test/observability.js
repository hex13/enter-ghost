'use strict';

const assert = require('assert');

const { createExample } = require('../testUtils');
const { Transmutable } = require('../transmutable');

describe('observability', () => {

    let t, ex, expected, original;
    beforeEach(() => {
        ex = createExample();
        original = ex;
        t = new Transmutable(ex);
        expected = createExample();
    });

    it('doesn\'t trigger observers if there are no mutations', () => {
        let c = 0;
        t.observe(() => {
            c++;
        });
        assert.strictEqual(c, 0);
        t.commit();
        assert.strictEqual(c, 0);
    });

    it('allows for observing changes after commit (in whole object)', () => {
        let c = 0;
        t.observe(() => {
            c++;
        });
        t.stage.a = 292828;
        assert.strictEqual(c, 0);
        t.commit();
        assert.strictEqual(c, 1);
        t.stage.a = 74342;
        t.commit();
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
        t.stage.a = 381211;
        t.commit();
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

        t.stage.observable.foo.cat = 981198;
        t.commit();
        assert.strictEqual(c, 1);
    });

    it('passes state to observer (when subscribing to path)', () => {
        let c = 0;
        expected.observable.foo.cat = 981198;

        t.observe(['observable'], (state) => {
            assert.deepStrictEqual(state, expected.observable);
            c++;
        });

        t.stage.observable.foo.cat = 981198;
        t.commit();
        assert.strictEqual(c, 1);
    });


    it('allows for observing changes (specific property)', () => {
        let c = 0;
        t.observe(['observable', 'foo', 'cat'], () => {
            c++;
        });
        assert.strictEqual(c, 0);
        t.stage.observable.foo.cat = 981198;
        t.commit();
        assert.strictEqual(c, 1);
    });

    it('allows for observing changes (parent observed, child changed)', () => {
        let c = 0;
        t.observe(['observable'], () => {
            c++;
        });
        assert.strictEqual(c, 0);
        t.stage.observable.foo.cat = 981198;
        t.commit();
        assert.strictEqual(c, 1);
    });

    it('allows for observing changes (child observed, parent changed)', () => {
        let c = 0;
        t.observe(['observable', 'foo', 'cat'], () => {
            c++;
        });
        assert.strictEqual(c, 0);
        t.stage.observable.foo = 981198;
        t.commit();
        assert.strictEqual(c, 1);
    });

    it('it triggers handler at most one after one commit (even if there are many mutations)', () => {
        let c = 0;
        t.observe(['observable', 'foo', 'cat'], () => {
            c++;
        });
        t.stage.observable.foo.cat = 981198;
        t.stage.observable.foo.cat = 282272;
        t.commit();
        assert.strictEqual(c, 1);
    });


    it('doesn\'t trigger observer if there is no matching mutation', () => {
        let c = 0;
        t.observe(['observable', 'foo', 'cat'], () => {
            c++;
        });
        t.stage.observable.foo.dog = 1234;
        t.commit();
        assert.strictEqual(c, 0);
    });

});
