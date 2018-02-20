'use strict';

const replacer = (name,v) => {
    if (v && v[0] && v[0].isChain) {
        return v.map(p=>p.key).join('')
    }
    if (name == 'parent') return v && v.nodeType;
    if (name=='scope' || name=='parent' || name =='___range' || name == 'refs' ||name=='loc') return undefined
    return v;
}

const fs = require('fs');
const util = require('util');
const oldRequire = require;

// TODO fix paths
require = path => path.indexOf('.') == 0? oldRequire('../' + path) : oldRequire(path);

const Analyzer = require('../analyzer');
const State = require('../state')(require('../analysisBuilder6'));
const chalk = require('chalk');
const autumnVisitor = require('../visitors/autumnVisitor.js')({

});
const {servicesAutumn: services} = require('../createQueryAutumn');


const parse = require('babylon').parse;
function createAnalyzer() {
    return new Analyzer({
        visitors: [autumnVisitor], State, postprocess: true,
        services,
    });
}


__dirname = __dirname + '/..';
const print = (o) => util.inspect(o, {colors: true, depth:10});


const mocks =
{
    scopes: fs.readFileSync(__dirname + '/../mocks/scopes.js', 'utf8'),
    objects: fs.readFileSync(__dirname + '/../mocks/6/objects.js', 'utf8'),
    vars: fs.readFileSync(__dirname + '/../mocks/6/variables.js', 'utf8'),
    refs: fs.readFileSync(__dirname + '/../mocks/autumn/refs.js', 'utf8'),
    mock: fs.readFileSync('/Users/lukasz/sandbox/meva-sandbox/variableMock.js', 'utf8'),
    object: fs.readFileSync(__dirname + '/../mocks/autumn/object.js', 'utf8'),
    function: fs.readFileSync(__dirname + '/../mocks/autumn/function.js', 'utf8'),
    big: fs.readFileSync(__dirname + '/../mocks/autumn/big.js', 'utf8'),
    outline: fs.readFileSync(__dirname + '/../mocks/autumn/outline.js', 'utf8'),
};


function analyze(code) {
    const ast = parse(code, {sourceType: 'module'});
    const analyzer = createAnalyzer();
    return analyzer.analyze(ast);
}

const { test } = require('tape');


function w(data, handler) {
    handler(data);
}


const testCases = [oldRequire('./cases/outline'), oldRequire('./cases/function')];

testCases.forEach(testCase => {
    test(testCase.desc, (assert) => {
        const analysis = analyze(mocks[testCase.mock]);
        testCase.verify(assert, analysis, analysis.finalState.scopez[0]);
    });
})
