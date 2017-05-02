"use strict";

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
        assert.equal(scopes.length, 6);
    });

    it('should have appropriate entries', () => {
        const entries = analysis.getEntries(scopes[0]);

        assertLength(Object.keys(entries), 5);
        console.log("####",entries)
        assert(entries['abc']);
        assert(entries['abc.prop1']);
        assert(entries['abc.prop1.deepProp']);
        assert(entries['abc.prop2']);
        assert(entries['def']);
        assert(entries['something']);
        assert(!entries['something.not']);
        assert.equal(entries['abc'].name, 'abc');
        //assert(entries['abc.prop']);
        assert.equal(entries['def'].name, 'def');
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
        ];

        refToDef.forEach(([[line, column], defLoc]) => {
            console.log("LYNIA".repeat(30), line, column)
            ref = analysis.refAt({
                line, column
            });
            entry = analysis.resolveRef(ref);
            assert(entry);
            assertSameLoc(analysis.rangeOf(entry), defLoc);
        });
    });

});
