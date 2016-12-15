"use strict";
const assert = require('assert');

const ghost = require('..');
const fs = require('fs');
const Path = require('path');

const { fork } = require('child_process');

describe('serviceProcess', () => {
    it('should send answer for the message', (done) => {
        const modulePath = Path.join(__dirname,'../serviceProcess.js');
        const configPath = Path.join(__dirname, '../mocks/exampleConfig.json');

        const cp = fork(modulePath, [configPath]);

        const fileMock = {};
        cp.send({type: 'request', name: 'abc', args: [fileMock]});
        cp.on('message', msg => {
            assert.equal(msg.type, 'response');
            assert.equal(msg.value, 1234);
            done();
        })
    });
});
