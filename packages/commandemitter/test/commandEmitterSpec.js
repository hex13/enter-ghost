const assert = require('assert');
const {createCommandEmitter} = require('..');
const {EventEmitter} = require('events');
describe('Command emitter', () => {
    it('should get shit done', (done) => {
        const ee = new EventEmitter;
        const ce = createCommandEmitter(ee);
        const animals = [];

        ce.on('doge', ({done}) => {
            animals.push('doge');
        });

        ce.on('doge', ({type, done}) => {
            setTimeout(() => {
                done();
            }, 100);
        });

        ce.on('animal', ({type, done}) => {
            animals.push(type);
            done();
        });

        ce.command('doge');
        ce.command('animal', {type: 'cat'});
        ce.command('animal', {type: 'squirrel'}).then(() => {
            animals.push('second squirrel');
        });

        setTimeout(() => {
            assert.deepEqual(animals, ['doge', 'cat', 'squirrel', 'second squirrel']);
            done();
        }, 600)
    });
});
