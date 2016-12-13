const assert = require('assert');
const createDoc = require('..');
const {EventEmitter} = require('events');
describe('createDoc', () => {
    const docCount = 10000;
    const app = {
        createEmitter: () => new EventEmitter
    };

    it('should have `emit`, `on` and `removeListener` methods (for partially exposing EventEmitter interface)', () => {
        const doc = createDoc(app);
        assert(doc.emit);
        assert(doc.on);
        assert(doc.removeListener);
    });

    it(`should create unique ids when creating ${docCount} documents`, () => {
        const ids = Object.create(null);
        for (let i = 0; i < docCount; i++) {
            const doc = createDoc(app);
            assert(doc.id, 'property `id` should exist and not be 0 or falsy');
            assert(!ids[doc.id], `property \`id\` should be unique, yet there already exists document with id=${doc.id}`);
            ids[doc.id] = true;
        }
    });

});
