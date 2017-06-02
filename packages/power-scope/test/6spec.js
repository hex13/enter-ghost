const Analyzer = require('../analyzer');
const assert = require('assert');

const { expect } = require('chai');
const fs = require('fs');

const get = require('lodash/get');
const _ = { get };

const services = require('../services');
const getters = require('../getters');

const createInquirer = require('../query');
const query = createInquirer(Object.assign({}, services, getters));


const mocks =
{
    basic: fs.readFileSync(__dirname + '/../mocks/basicMock.js', 'utf8'),
    scopes: fs.readFileSync(__dirname + '/../mocks/scopes.js', 'utf8'),
    outline: fs.readFileSync(__dirname + '/../mocks/outline.js', 'utf8'),
    comments: fs.readFileSync(__dirname + '/../mocks/comments.js', 'utf8'),
    nodes: fs.readFileSync(__dirname + '/../mocks/nodes.js', 'utf8'),
    jsx: fs.readFileSync(__dirname + '/../mocks/jsx.js', 'utf8'),
    implicit: fs.readFileSync(__dirname + '/../mocks/implicit.js', 'utf8'),
    exports: fs.readFileSync(__dirname + '/../mocks/exports.js', 'utf8'),
    imports: fs.readFileSync(__dirname + '/../mocks/imports.js', 'utf8'),
    commonjs: fs.readFileSync(__dirname + '/../mocks/commonjs.js', 'utf8'),

    objects: fs.readFileSync(__dirname + '/../mocks/6/objects.js', 'utf8'),
    vars: fs.readFileSync(__dirname + '/../mocks/6/variables.js', 'utf8'),
    arrays: fs.readFileSync(__dirname + '/../mocks/6/arrays.js', 'utf8'),
    benchmark: fs.readFileSync(__dirname + '/../x.js', 'utf8'),
    refs: fs.readFileSync(__dirname + '/../mocks/6/refs.js', 'utf8'),
};

const parse = require('babylon').parse;

const { assertSameLoc, assertLengthWithWarning: assertLength } = require('../testHelpers');


const basicVisitor = require('../visitors/basic');
const additionalVisitor = require('../visitors/additional');
const jsxVisitor = require('../visitors/jsx');
const eduVisitor = require('../visitors/edu');
const exportsVisitor = require('../visitors/exports');
const outlineVisitor = require('../visitors/outline')({
    components: ['jsx']
});
const commentsVisitor = require('../visitors/comments');
const provider = require('../visitors/provider');
const receiver = require('../visitors/receiver');

const {inspect } = require('util');
const sixVisitor = require('../visitors/6.js')({

});

const analyzerOpts = {
    visitors: [sixVisitor]
};

const State = require('../state')(require('../analysisBuilder6'));


describe('objects', () => {

    let analyzer;
    let ast;
    let analysis;
    let scopes;
    before(() => {
        ast = parse(mocks.objects, {sourceType: 'module'});
        analyzer = new Analyzer({visitors: [sixVisitor], State, postprocess: false});
        analysis = analyzer.analyze(ast);
    });

    it('should understand objects', () => {
        console.log(inspect(analysis.objects, {depth:null}));
        const obj = analysis.objects[0];

        const props = [
            {path: 'meth', range: [2, 4, 2, 8]},
            {path: 'funcExpr', range: []},
            {path: 'a', range: []},
            {path: 'a.a1', range: [9, 8, 9, 10]},
            {path: 'a.a1.a2', range: [10, 12, 10, 14]},
            {path: 'boo', range: [13, 4, 13, 7]},
        ];

        //expect(obj.props).to.have.deep.keys(props.map(p => p.name));
        props.forEach(({path, range}) => {
            const binding = query(obj).prop(path).binding(); // _.get(obj.props, path);
            expect(binding).exist;
            const name = path.split('.').pop();
            expect(binding).have.property('name', name, 'Binding name should be the same as key name.');
            if (range.length) {
                expect(binding).have.nested.property('loc.start').eql({
                    line: range[0],
                    column: range[1]
                });

                expect(binding).have.nested.property('loc.end').eql({
                    line: range[2],
                    column: range[3]
                });
            }
        });
        expect(obj.props).nested.property('boo.value.props').to.eql({});

        const thisMap = analysis.thisMap;

        assert.equal(thisMap.get(query(obj).prop('meth').def()), obj);
        assert.equal(thisMap.get(query(obj).prop('funcExpr').def()), obj);
    });

});


describe('variables', () => {

    let analyzer;
    let ast;
    let analysis;
    let scopes;
    before(() => {
        ast = parse(mocks.vars, {sourceType: 'module'});
        analyzer = new Analyzer({visitors: [sixVisitor], State, postprocess: false});
        analysis = analyzer.analyze(ast);
    });

    it('should understand variables', () => {
        analysis.declarators[0].init = undefined; // Don't check `init` for now
        expect(analysis.declarators[0]).eql(
            {kind: 'const', name: 'someVariable', init: undefined}
        );

        expect(analysis.declarators[1]).eql(
            {kind: 'let', name: 'someOtherVariable', init: {value: 3}}
        );

    });

    it('scopes should have variables', () => {
        expect(analysis.scopes[0].vars).have.keys('someVariable');
        expect(analysis.scopes[1].vars).have.keys('someOtherVariable');
        //expect(analysis.scopes[1].vars).have.nested.property('someOtherVariable.value.value', 3);
        expect(query(analysis.scopes[1]).var('someOtherVariable').def().value).equal(3);
    });
});


describe('scopes', () => {

    let analyzer;
    let ast;
    let analysis;
    let scopes;

    const correctScopes = [
            {range: [1, 0, 100, 0], isFunctionScope: true},
            {range: [2, 0, 6, 1]},
            {range: [2, 16, 6, 1], isFunctionScope: true},
            {range: [3, 14, 5, 5]},
            {range: [4, 8, 4, 41]},
            {range: [4, 37, 4, 41]},
            {range: [9, 11, 11, 5], isFunctionScope: true},
    ];
    before(() => {
        ast = parse(mocks.scopes, {sourceType: 'module'});
        analyzer = new Analyzer({visitors: [sixVisitor], State, postprocess: false});
        analysis = analyzer.analyze(ast);
    });

    it('should understand scopes', () => {
        console.log("X", inspect(analysis.declarators, {colors:true,depth: null}));
        expect(analysis.scopes.length).equal(7);
        correctScopes.forEach((correctScope, i) => {
            expect(analysis.scopes[i].range).eql(correctScope.range);
            expect(analysis.scopes[i].isFunctionScope).equal(!!correctScope.isFunctionScope);

        });
    });
});

describe('refs', () => {

    let analyzer;
    let ast;
    let analysis;
    let scopes;
    before(() => {
        ast = parse(mocks.refs, {sourceType: 'module'});
        analyzer = new Analyzer({visitors: [sixVisitor], State, postprocess: false});
        analysis = analyzer.analyze(ast);
    });

    it('should understand refs', () => {
        expect(analysis.refs.map(analysis.textOf)).eql([
            'abc.def',
            'ghi',
            'jkl'
        ]);
        expect(analysis.refs[0][0].scope).equal(analysis.scopes[0]);

        expect(analysis.textOf(analysis.refAt({
            line: 7,
            column: 1
        }))).equal('abc');

        expect(query(analysis).refAt({
            line: 7,
            column: 4
        }).text()).equal('abc.def');
    });
});

xdescribe('benchmark', () => {

    let analyzer;
    let ast;
    let analysis;
    let scopes;
    before(() => {
        let t0 = Date.now(), t1, d;
        ast = parse(mocks.benchmark, {sourceType: 'module'});
        d = Date.now() - t0;
        console.log("CZAAAAAAS PARSOWANIA", d)

        analyzer = new Analyzer({visitors: [sixVisitor], State, postprocess: false});
        t0 = Date.now();
        analysis = analyzer.analyze(ast);
        d = Date.now() - t0;
        console.log("CZAAAAAAS analizy", d)

    });

    it('...', () => {
    });
});
