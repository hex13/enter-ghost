const assert = require('assert');

function assertSameLoc(given, expected) {
    if (expected.length == 4) {
        expected = {
            start: {
                line: expected[0],
                column: expected[1],
            },
            end: {
                line: expected[2],
                column: expected[3],
            },
        }
    }

    // sometimes loc objects have also `identifierName` property
    // which we can ignore but this is still here
    // and this influences comparison result
    // that's why we can't just write `assert.deepEqual(given, expected)`
    assert(given);
    assert(expected);
    assert.deepEqual(given.start, expected.start);
    assert.deepEqual(given.end, expected.end);
}

exports.assertSameLoc = assertSameLoc;


function assertLength(array, length) {
    assert.equal(array.length, length);
}

function assertLengthWithWarning(array, length) {
    if (array.length != length)
        console.warn("array length mismatch. It should equal ", length, " but it equals ", array.length);
}


exports.assertLength = assertLength;
exports.assertLengthWithWarning = assertLengthWithWarning;

exports.nop = () => {};
