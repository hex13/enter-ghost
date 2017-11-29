'use strict';

const {test} = require('tape');

const {parse} = require('./funquery2');

test('empty string', (t) => {
    const query = '';
    const res = parse(query);
    t.deepEqual(res, [
        'block',
    ]);
    t.end();
});

test('empty block on command place', (t) => {
    const query = '{  }';
    const res = parse(query);
    t.deepEqual(res, [
        'block',
        [
            ['block']
        ]
    ]);
    t.end();
});

test('empty block as argument', (t) => {
    const query = 'a {  }';
    const res = parse(query);
    t.deepEqual(res, [
        'block',
        [
            'a',
            ['block']
        ]
    ]);
    t.end();
});

test('block with command without arguments', (t) => {
    const query = '{ abc }';
    const res = parse(query);
    t.deepEqual(res, [
        'block',
        [
            [
                'block',
                ['abc']
            ]
        ]
    ]);
    t.end();
});

test('block with command with argument', (t) => {
    const query = '{ abc def }';
    const res = parse(query);
    t.deepEqual(res, [
        'block',
        [
            ['block',
                ['abc', 'def']
            ]
        ]
    ]);
    t.end();
});

test('block containing command with other block (containing command) as argument', (t) => {
    const query = '{ abc { def } }';
    const res = parse(query);
    t.deepEqual(res, [
        'block',
        [
            [
                'block',
                [
                    'abc',
                    [
                        'block',
                        ['def']
                    ]
                ]
            ]
        ]
    ]);
    t.end();
});

test('block with two commands without arguments, separated by `;`', (t) => {
    const query = '{ abc ; def }';
    const res = parse(query);
    t.equal(res[0], 'block');
    t.deepEqual(res[1], [
        [
            'block',
            ['abc'],
            ['def'],
        ]
    ]);
    t.end();
});

test('block with two commands without arguments, separated by `|`', (t) => {
    const query = '{ abc | def }';
    const res = parse(query);
    t.equal(res[0], 'block');
    t.deepEqual(res[1], [[
        'block',
        ['abc'],
        ['pipe', 'def'],
    ]]);
    t.end();
});

test('one command without arguments', (t) => {
    const query = 'something';
    const res = parse(query);
    t.deepEqual(res, [
        'block',
        ['something']
    ]);
    t.end();
});


test('two commands with arguments', (t) => {
    const query = 'something foo; blah bar';
    const res = parse(query);
    t.deepEqual(res, [
        'block',
        ['something', 'foo'],
        ['blah', 'bar'],
    ]);
    t.end();
});
