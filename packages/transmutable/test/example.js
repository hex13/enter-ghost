const _require = require;
const assert = require('assert');

const {transformAt} = require('../transform');



describe('example', () => {
    it('transformAt', () => {
        const require = (module) => {
            if (module == 'transmutable') return _require('..');
        };


        const original = {
            some: {
                deep: {
                    object: {
                        foo: 123,
                        bar: 'hello'
                    }
                }
            }
        }
        const copy = transformAt(d => d.some.deep.object, d => {
        	d.foo = 456;
            d.bar += ' world';
        }, original);

        assert.deepStrictEqual(copy, {
            some: {
                deep: {
                    object: {
                        foo: 456,
                        bar: 'hello world'
                    }
                }
            }
        });
    });
    it('works', () => {


        const require = (module) => {
            if (module == 'transmutable') return _require('..');
        };

        // COPY FROM HERE
        const log = console.log.bind(console);

        const { transform } = require('transmutable');

        (() => {
            const { transform } = require('transmutable');

            const original = {a: 123};

            const copy = transform(draft => {
            	draft.a = 456;
            }, original);

            console.log({original, copy});
            // { original: { a: 123 }, copy: { a: 456 } }

        })();

        const original = {
            cow: 123,
            dogs: {
                muchWow: 1
            }
        };

        // easy way:

        const copy = transform(stage => {
            stage.cow = 'doge';
        }, original);

                log(copy); // { cow: 'doge', dogs: { muchWow: 1 } }
                log(original); // still the same: { cow: 123, dogs: { muchWow: 1 } }
                log(copy.dogs === original.dogs); // true



        // END COPY FROM HERE

        assert.deepStrictEqual(original, {cow: 123, dogs:{muchWow:1}});

    });
});
