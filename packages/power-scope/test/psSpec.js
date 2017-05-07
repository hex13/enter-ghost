"use strict";
// TODO test scopes (declareScope, former analysis.scopes.push)
// TODO test scopes set by function declaration
const Analyzer = require('../analyzer');
const assert = require('assert');

const fs = require('fs');

const basicCode = fs.readFileSync(__dirname + '/../mocks/scopes.js', 'utf8');
const parse = require('babylon').parse;

const { assertSameLoc, assertLengthWithWarning: assertLength } = require('../testHelpers');


const basicVisitor = require('../visitors/basic');
const eduVisitor = require('../visitors/edu');

const analyzerOpts = {
    visitors: [basicVisitor, eduVisitor]
}


describe('Analyzer', () => {

    let analyzer;
    let ast;
    let analysis;
    let scopes;
    before(() => {
        ast = parse(basicCode);
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
