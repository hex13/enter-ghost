const assert = require('assert');
const input = `
WAHRRHEE is jdi so isdo my-prefix: ["call", {"name": "blah"}]
sopdo dpdosdSDDO SDSOD DSO my-prefix: ["ret", {"value": 5}]
`;


const parseEventsFromJsonLogs = require('../parseEventsFromJsonLogs');

describe('parseEventsFromJsonLogs',() => {
    it('it should parse from logs using Regexp', () => {
        const events =  parseEventsFromJsonLogs(input, /^.*?my-prefix: /);
        assert.equal(events.length, 2);
        assert.deepEqual(events[0], ['call', {'name': 'blah'}]);
        assert.deepEqual(events[1], ['ret', {'value': 5}]);
    });
});
