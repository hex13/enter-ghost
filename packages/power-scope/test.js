"use strict";
process.send = process.send || console.log;
const mocha = new (require('mocha'));
mocha.addFile(__dirname + '/test/6spec.js');

let messages = [];
const runner = mocha.run(failures => {
    console.error("FAILURES", failures)
    process.send({
        failures,
        messages
    })
    process.exit();
});

runner.on('fail', (err) => {
    console.log("FAIL")
    messages = [err.err.stack];
})
