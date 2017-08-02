const _require = require;
const assert = require('assert');

describe('example', () => {
    it('works', () => {
        const require = (module) => {
            if (module == 'transmutable') return _require('..');
        };

        // COPY FROM HERE

        const { Transmutable } = require('transmutable');
        const log = console.log.bind(console);

        const original = {
            cow: 123,
            dogs: {
                muchWow: 1
            }
        };

        const t = new Transmutable(original);
        t.stage.cow = 456;
        t.stage.dogs.muchWow = 888888;
            log(t.reify()); // { cow: 456, dogs: { muchWow: 888888 } }
            log(t.stage.dogs); // { muchWow: 1 }

        const copied = t.commit();

            log(copied); // { cow: 456, dogs: { muchWow: 888888 } }

            log(original); // { cow: 123, dogs: { muchWow: 1 } }

        // END COPY FROM HERE

        assert.deepStrictEqual(original, {cow: 123, dogs:{muchWow:1}});
        assert.deepStrictEqual(copied, { cow: 456, dogs: { muchWow: 888888 } });
    });
});
