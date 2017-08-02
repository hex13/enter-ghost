const _require = require;
const assert = require('assert');

describe('example', () => {
    it('works', () => {
        const require = (module) => {
            if (module == 'transmutable') return _require('..');
        };

        // COPY FROM HERE

        const transmutable = require('transmutable').transmutable();
        const log = console.log.bind(console);

        const original = {
            cow: 123,
            dogs: {
                muchWow: 1
            }
        };

        const forked = transmutable.fork(original);
        forked.stage.cow = 456;
        forked.stage.dogs.muchWow = 888888;
            log(forked.reify()); // { cow: 456, dogs: { muchWow: 888888 } }
            log(forked.stage.dogs); // { muchWow: 1 }

        const copied = forked.commit();

            log(copied); // { cow: 456, dogs: { muchWow: 888888 } }

            log(original); // { cow: 123, dogs: { muchWow: 1 } }

        // END COPY FROM HERE

        assert.deepStrictEqual(original, {cow: 123, dogs:{muchWow:1}});
        assert.deepStrictEqual(copied, { cow: 456, dogs: { muchWow: 888888 } });
    });
});
