'use strict';

const { Matcher } = require('../matcher');
const assert = require('assert');

describe('Matcher', () => {
    describe('#match', () => {
        let m;
        beforeEach(() => {
            m = new Matcher((id, entity) => entity.id === id);
            m.add({id: 10, text: 'Warsaw'});
            m.add({id: 20, text: 'Krakow'});
            m.add({id: 30, text: 'London'});
        });

        it('matches one', () => {
            const res = m.match(20);
            assert.deepStrictEqual(res, {id: 20, text: 'Krakow'});
        });
    });

    describe('#matchAll', () => {
        let m;
        beforeEach(() => {
            m = new Matcher((f, entity) => f(entity));

            m.add({id: 1, text: 'one'});
            m.add({id: 2, text: 'two'});
            m.add({id: 3, text: 'three'});
            m.add({id: 4, text: 'four'});
            m.add({id: 5, text: 'five'});
        });

        it('matches all', () => {
            const res = m.matchAll(entity => entity.id >= 3);
            assert.deepStrictEqual(res, [
                {id: 3, text: 'three'},
                {id: 4, text: 'four'},
                {id: 5, text: 'five'},
            ]);
        });
    });


});