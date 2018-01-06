const _require = require;
const assert = require('assert');

describe('example', () => {
    it('works', () => {
        const require = (module) => {
            if (module == 'transmutable') return _require('..');
        };

        // COPY FROM HERE
        const log = console.log.bind(console);

        const { transform } = require('transmutable');


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
