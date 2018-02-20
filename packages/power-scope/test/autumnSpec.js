'use strict';

const replacer = (name,v) => {
    if (v && v[0] && v[0].isChain) {
        return v.map(p=>p.key).join('')
    }
    if (name == 'parent') return v && v.nodeType;
    if (name=='scope' || name=='parent' || name =='___range' || name == 'refs' ||name=='loc') return undefined
    return v;
}


const Analyzer = require('../analyzer');
const State = require('../state')(require('../analysisBuilder6'));
const chalk = require('chalk');
const autumnVisitor = require('../visitors/autumnVisitor.js')({

});
const {servicesAutumn: services} = require('../createQueryAutumn');


function createAnalyzer() {
    return new Analyzer({
        visitors: [autumnVisitor], State, postprocess: true,
        services,
    });
}




const assert = require('assert');

const { expect } = require('chai');
const fs = require('fs');

const get = require('lodash/get');
const _ = { get };


const util = require('util');
const mocks =
{
    scopes: fs.readFileSync(__dirname + '/../mocks/scopes.js', 'utf8'),
    objects: fs.readFileSync(__dirname + '/../mocks/6/objects.js', 'utf8'),
    vars: fs.readFileSync(__dirname + '/../mocks/6/variables.js', 'utf8'),
    //arrays: fs.readFileSync(__dirname + '/../mocks/6/arrays.js', 'utf8'),
    //benchmark: fs.readFileSync(__dirname + '/../x.js', 'utf8'),
    refs: fs.readFileSync(__dirname + '/../mocks/autumn/refs.js', 'utf8'),
    mock: fs.readFileSync('/Users/lukasz/sandbox/meva-sandbox/variableMock.js', 'utf8'),
    object: fs.readFileSync(__dirname + '/../mocks/autumn/object.js', 'utf8'),
    function: fs.readFileSync(__dirname + '/../mocks/autumn/function.js', 'utf8'),
    big: fs.readFileSync(__dirname + '/../mocks/autumn/big.js', 'utf8'),
};

const parse = require('babylon').parse;

const { assertSameLoc, assertLengthWithWarning: assertLength } = require('../testHelpers');


const {inspect } = require('util');

function evaluate() {

}
function getValue(analysis) {
    return analysis.finalState.expr[0];
}

function analyze(code) {
    const ast = parse(code, {sourceType: 'module'});
    const analyzer = createAnalyzer();
    return analyzer.analyze(ast);
}

const print = (o) => util.inspect(o, {colors: true, depth:10});

const margin = (indent) => ' '.repeat(indent * 4);

describe('objects', () => {

    let analysis;
    let scopes;
    before(() => {
        analysis = analyze(mocks.function);

        //require('fs').writeFileSync('analysis.json', JSON.stringify(analysis,0,2));
    });

    it('', () => {
        const analysis = analyze(mocks.function);
        const programScope = analysis.finalState.scopez[0];
        const functionScope = programScope.scopes[0];
        const functionBodyScope = functionScope.scopes[0]

        expect(functionScope.vars.map(v=>v.name)).deep.equal(
            ['arg1', 'arg2']
        )

        expect(functionBodyScope.vars.map(v=>v.name)).deep.equal(
            ['local']
        );

    });

    it('', () => {
        const analysis = analyze(mocks.refs);
        //forEachScope(analysis, analysis.finalState.scopez[0]);
        console.log("TO JEST ANALYZA", analysis);

        const test =JSON.stringify(analysis.finalState.scopez[0],replacer,4)
        console.log("DUMP", test)

        console.log('\n', chalk.blue('------'));
    });

    xit('', () => {
        const analysis = analyze(mocks.big);
        console.log("BIG:", print(analysis.finalState.scopez));

    });

    it('', () => {
        const vars = analysis.finalState.vars.map(v => {
            return v.name;
        });
        console.log("VARIABLES",vars);
        console.log('global refs', analysis.refs.map(ref =>ref.map(part=>part.key).join('')  ).join('\n') )
        console.error('$$$$$$$$$$$$', analysis.finalState.scopez);
        const rootScope = analysis.finalState.scopez[0].scopes[0];

        assert(analysis.finalState.scopez[0].refs);
        console.log(`refs`, rootScope.refs);

        rootScope.scopes.forEach((scope,i) => {
            assert(scope.refs, `scope ${i} should have refs`);
            console.log(`refs ${i}@${scope.range}`, scope.refs);
        })
        console.log("VARIABLES",vars);
            const test =JSON.stringify(analysis.finalState.scopez[0],replacer,4)
        console.log("DUMP", test)

    });
});
