const assert = require('assert');
const {createLayout} = require('..');
const {EventEmitter} = require('events');
describe('created layout', () => {

    const app = {
        createEmitter: () => new EventEmitter
    };

    beforeEach(() => {
        this.layout = createLayout(app);
        this.doc = {};
    })


    it('should have `add`, `remove` and `find` methods', () => {
        const { layout } = this;
        assert.equal(typeof layout.add, 'function');
        assert.equal(typeof layout.remove, 'function');
        assert.equal(typeof layout.find, 'function');
    });

    it('shouldn\'t find a doc before adding', () => {
        assert.equal(this.layout.find(this.doc), undefined);
    });


    it('should add, find and remove docs', () => {
        const { layout, doc } = this;
        let cell;

        layout.add(doc);

        cell = layout.find(doc);
        assert.equal(cell.doc, doc);
        assert.equal(layout.find({}), undefined,`it shouldn't find a doc that wasn't added`);

        layout.remove(doc);

        cell = layout.find(doc);
        assert.equal(cell, undefined, `it shouldn't find a doc after removing`);
    });

});
