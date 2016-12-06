wrapper for EventEmitter which queues events and add `done` method to them.
Each event becomes command which is triggered after previous command is done.

API:
`createCommandEmitter(ee: {emit, on}) : {command, on};`

example:
```javascript

const assert = require('assert');
const {createCommandEmitter} = require('commandemitter');
const {EventEmitter} = require('events');

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
ce.command('animal', {type: 'squirrel'});

setTimeout(() => {
    assert.deepEqual(animals, ['doge', 'cat', 'squirrel']);
    done();
}, 600)
```
