"use strict";

const mocha = new (require('mocha'));
mocha.addFile('test/psSpec.js');
mocha.run(failures => {
    console.log("FAILURES", failures)
});
