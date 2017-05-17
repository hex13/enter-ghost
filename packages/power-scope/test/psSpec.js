"use strict";
// TODO test scopes (declareScope, former analysis.scopes.push)
// TODO test scopes set by function declaration
const Analyzer = require('../analyzer');
const assert = require('assert');

const fs = require('fs');

const mocks =
{
    basic: fs.readFileSync(__dirname + '/../mocks/basicMock.js', 'utf8'),
    scopes: fs.readFileSync(__dirname + '/../mocks/scopes.js', 'utf8'),
    outline: fs.readFileSync(__dirname + '/../mocks/outline.js', 'utf8'),
    comments: fs.readFileSync(__dirname + '/../mocks/comments.js', 'utf8'),
    nodes: fs.readFileSync(__dirname + '/../mocks/nodes.js', 'utf8'),
    jsx: fs.readFileSync(__dirname + '/../mocks/jsx.js', 'utf8'),
};

const parse = require('babylon').parse;

const { assertSameLoc, assertLengthWithWarning: assertLength } = require('../testHelpers');


const basicVisitor = require('../visitors/basic');
const additionalVisitor = require('../visitors/additional');
const jsxVisitor = require('../visitors/jsx');
const eduVisitor = require('../visitors/edu');
const outlineVisitor = require('../visitors/outline')({
    components: ['jsx']
});
const commentsVisitor = require('../visitors/comments');
const provider = require('../visitors/provider');
const receiver = require('../visitors/receiver');

const analyzerOpts = {
    visitors: [basicVisitor, eduVisitor, outlineVisitor, commentsVisitor, provider, receiver]
};

describe('provider and receiver', () => {

    let analyzer;
    let ast;
    let analysis;
    let scopes;
    before(() => {
        ast = parse(mocks.nodes);
        analyzer = new Analyzer({visitors: [provider, receiver]});
        analysis = analyzer.analyze(ast);
    });

    it('should set and get component', () => {
        analysis.setComponent('id_1', 'component', 4);
        analysis.setComponent('id_2', 'component', 3);
        analysis.setComponent('id_1', 'othercomponent', 5);
        assert.equal(analysis.getComponent('id_1', 'component'), 4);
        assert.equal(analysis.getComponent('id_1', 'othercomponent'), 5);
        assert.equal(analysis.getComponent('id_2', 'component'), 3);
    });

    it('two plugins should communicate', () => {
        assert.deepEqual(analysis.getComponent('names', 'receiver'), ['foo', 'bar']);
        assert.equal(analysis.getComponent(undefined, 'receiver'), 'no node');
    });
});

xdescribe('nodes', () => {

    let analyzer;
    let ast;
    let analysis;
    let scopes;
    before(() => {
        ast = parse(mocks.nodes);
        analyzer = new Analyzer(analyzerOpts);
        analysis = analyzer.analyze(ast);
    });

    it('should have appropriate comments', () => {
        console.log("sSSSSSSSSSSS".repeat(10));
        console.log(analysis.scopeAt({line:2,column:4}));
        console.log("=3-3-3-33-3-".repeat(10));
        const entry = analysis.entryAt({
            line: 2,
            column: 4
        });
        assert.equal(entry.name, 'abc');
        assert.equal(entry.nodeId, 1);
    });
});

xdescribe('comments', () => {

    let analyzer;
    let ast;
    let analysis;
    let scopes;
    before(() => {
        ast = parse(mocks.comments);
        analyzer = new Analyzer(analyzerOpts);
        analysis = analyzer.analyze(ast);
    });

    it('should have appropriate comments', () => {
        console.log("sSSSSSSSSSSS".repeat(10));
        console.log(analysis.scopeAt({line:4,column:0}));
        console.log("=3-3-3-33-3-".repeat(10));
        const entry = analysis.entryAt({
            line: 4,
            column: 8
        });
        assert(entry.name)
        assert(analysis.commentsFor);
    });
});

describe('outline', () => {

    let analyzer;
    let ast;
    let analysis;
    let scopes;
    before(() => {
        ast = parse(mocks.outline, {plugins:['jsx']});
        analyzer = new Analyzer({
            visitors: [basicVisitor, additionalVisitor, jsxVisitor, outlineVisitor]
        });
        analysis = analyzer.analyze(ast);
    });

    it('should have appropriate structure', () => {
        const outline = analysis.getComponent('file', 'outline');
        console.log("OOOOO OUTLINE", JSON.stringify(outline, 0, 2));
        let item;
        assert.strictEqual(outline.type, 'file');
        assert.strictEqual(outline.children.length, 4);

        item = outline.children[0];

        assert.deepEqual(item, {
            type: 'class',
            name: 'Abc',
            children: [
                {type: 'function', name: 'construct', children: [
                    {type: 'variable', name: 'a', children: []},
                    {type: 'function', name: 'b', children: []},
                    {type: 'class', name: 'SubClass', children: []},
                    {type: 'variable', name: 'added', children: []},
                ]},
                {type: 'function', name: 'render', children: [], jsx: {
                    uses: {A: 1}
                }},
            ]
        });

        item = outline.children[1];

        assert.deepEqual(item, {
            type: 'class',
            name: 'Def',
            children: [
                // {type: 'function', name: 'handleClick', children: []},
            ]
        });

        item = outline.children[2];

        assert.deepEqual(item, {
            type: 'function',
            name: 'whatever',
            children: [
                {type: 'case', test: 1},
                {type: 'case', test: 2},
                {type: 'case', test: 3},
                {type: 'case', test: null},
            ],
        });

        item = outline.children[3];

        assert.deepEqual(item, {
            type: 'function',
            name: 'Foo',
            children: [
                // {type: 'function', name: 'handleClick', children: []},
            ],
            jsx: {
                uses: {}
            }
        });

    });

});



describe('jsx', () => {

    let analyzer;
    let ast;
    let analysis;
    let scopes;
    before(() => {
        ast = parse(mocks.jsx, {plugins:['jsx']});
        analyzer = new Analyzer({
            visitors: [basicVisitor, jsxVisitor]
        });
        analysis = analyzer.analyze(ast);
    });

    it('should have appropriate refs', () => {
        let ref, def;
        ref = analysis.refAt({
            line: 5,
            column: 16
        });
        assert(ref);
        assert.equal(analysis.textOf(ref), 'Component');
        def = analysis.resolveRef(ref);
        assert(def);
        assertSameLoc(analysis.rangeOf(def), [3, 12, 3, 21]);

        ref = analysis.refAt({
            line: 6,
            column: 13
        });
        assert(ref);
        assert.equal(analysis.textOf(ref), 'Component2');
        def = analysis.resolveRef(ref);
        assert(def);
        assertSameLoc(analysis.rangeOf(def), [4, 17, 4, 27]);

    });

    it('should have appropriate dependency information', () => {
        let ref, def;

        const Foo = analysis.scopes[0].entries.Foo;
        const Bar = analysis.scopes[0].entries.Bar;
        assert(Foo);
        assert(Bar);
        let jsx;

        jsx = analysis.getComponent(Foo.nodeId, 'jsx');
        assert.deepEqual(jsx, {
            uses: {Component: 1, Component2: 1}
        });

        jsx = analysis.getComponent(Bar.nodeId, 'jsx');
        assert.equal(jsx, undefined);

    });

});


describe('scopes', () => {

    let analyzer;
    let ast;
    let analysis;
    let scopes;
    before(() => {
        ast = parse(mocks.scopes);
        analyzer = new Analyzer(analyzerOpts);
        analysis = analyzer.analyze(ast);
    });

    it('should have appropriate scopes', () => {
        const scopes = analysis.getScopes();
        assert.equal(scopes.length, 8);
        assertSameLoc(analysis.rangeOf(scopes[0]), [1, 0, 100, 0]);
        assertSameLoc(analysis.rangeOf(scopes[1]), [2, 0, 6, 1]);
        assertSameLoc(analysis.rangeOf(scopes[2]), [2, 16, 6, 1]);
        assertSameLoc(analysis.rangeOf(scopes[3]), [3, 14, 5, 5]);
        assertSameLoc(analysis.rangeOf(scopes[4]), [4, 8, 4, 41]);
        assertSameLoc(analysis.rangeOf(scopes[5]), [4, 37, 4, 41]);
        assertSameLoc(analysis.rangeOf(scopes[6]), [9, 4, 11, 5]);
        assertSameLoc(analysis.rangeOf(scopes[7]), [9, 11, 11, 5]);
    });

});

describe('Analyzer', () => {

    let analyzer;
    let ast;
    let analysis;
    let scopes;
    before(() => {
        ast = parse(mocks.basic);
        analyzer = new Analyzer(analyzerOpts);
        analysis = analyzer.analyze(ast);
    });

    it('should have appropriate methods', () => {
        assert(analysis);
        assert.equal(typeof analysis.getScopes, 'function');
    });

    it('should have appropriate scopes', () => {
        scopes = analysis.getScopes();
        //assert.equal(scopes.length, 7);
    });


    it('should have appropriate rfs', () => {
        analysis.refs.forEach(ref => {
            const text = analysis.textOf(ref);
            assert(ref.length > 1 || (!text.includes('.')), `${text} should not be in one part ref`);
        });
    });

    it('should have appropriate entries', () => {
        const entries = analysis.getEntries(scopes[0]);
        assertLength(Object.keys(entries), 5);

        assert(entries['abc']);
        assert(entries['abc.prop1']);
        assert(entries['abc.prop1.deepProp']);
        assert.equal(entries['abc.prop1.deepProp'].name, 'deepProp');
        assert(entries['abc.prop2']);
        assert(entries['def']);
        assert(entries['something']);
        assert(!entries['something.not']);
        assert(entries['foo']);

        assert.equal(entries['abc'].name, 'abc');
        //assert(entries['abc.prop']);
        assert.equal(entries['def'].name, 'def');
        //console.log("@@@@".repeat(20), entries['def'].scope.entries);
    });

    it('should return scopeAt', () => {
        let scope;
        scope = analysis.scopeAt({
            line: 13, column: 0
        });
        assertSameLoc(analysis.rangeOf(scope), [12, 16, 17, 1])

        scope = analysis.scopeAt({
            line: 20, column: 0
        });
        assertSameLoc(analysis.rangeOf(scope), [19, 10, 22, 1])

    });


    it('should return entryAt', () => {
        let entry;
        entry = analysis.entryAt({
            line: 13, column: 11
        });
        assertSameLoc(analysis.rangeOf(entry), [13, 10, 13, 13])
    });

    it('should return ref at given position', () => {
        let ref;
        ref = analysis.refAt({
            line: 15, column: 4
        });
        assert(ref);
        assert.equal(analysis.textOf(ref), 'ooo');

        ref = analysis.refAt({
            line: 16, column: 13
        });
        assert(ref);
        assert.equal(analysis.textOf(ref), 'ooo.abc.def');
    });


    it('should return definition for one element ref at given position', () => {
        let ref;
        ref = analysis.refAt({
            line: 15, column: 4
        });

        let entry;
        entry = analysis.resolveRef(ref);
        assert(entry);
        assertSameLoc(analysis.rangeOf(entry), [13, 10, 13, 13]);
    });

    it('should return definition for multiple element ref at given position', () => {
        let ref;
        let entry;

        // array of items in format: [refPos, defLoc]
        // where refPos is array: [line, column]
        // and defLoc is array: [startLine, startColumn, endLine, endColumn]
        const refToDef = [
            // we have chain `ooo.abc.def`. These are parts of it:
            [[16, 4], [13, 10, 13, 13]], // `ooo`
            [[16, 12], [13, 23, 13, 26]], // `ooo.abc`
            [[16, 10], [13, 17, 13, 20]], // `ooo.abc.def`
            // another chain, with method calling
            [[16, 23], [13, 32, 13, 36]], // `ooo.meth`
            // arg1
            [[25, 4], [24, 14, 24, 18]], // `ooo.meth`
            // arg
            [[13, 44], [13, 37, 13, 40], [13, 32, 13, 54]],
            // foo()
            [[38, 6], [24, 9, 24, 12]],
        ];

        refToDef.forEach(([[line, column], defLoc, scopeLoc]) => {
            ref = analysis.refAt({
                line, column
            });
            entry = analysis.resolveRef(ref);
            assert(entry, `ref at ${line}:${column} should be resolved to an entry`);
            assertSameLoc(analysis.rangeOf(entry), defLoc);
            //console.log("LLLLO", line, column, entry.scope.loc)
            if (scopeLoc) {

                assertSameLoc(entry.scope.loc, scopeLoc);
            }
        });
    });

});
