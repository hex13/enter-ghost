"use strict";

const Analyzer = require('../analyzer');
const assert = require('assert');

const fs = require('fs');

const basicCode = fs.readFileSync(__dirname + '/../mocks/basic.js', 'utf8');
const chainCode = fs.readFileSync(__dirname + '/../mocks/chains.js', 'utf8');

const parse = require('babylon').parse;

const { assertSameLoc } = require('../testHelpers');

describe('Analyzer', () => {

    let analyzer;
    let ast;
    let analysis;
    beforeEach(() => {
        ast = parse(basicCode);
        analyzer = new Analyzer();
        analysis = analyzer.analyze(ast);
    });

    it('should have appropriate methods', () => {
        assert(analysis);
        assert.equal(typeof analysis.getScopes, 'function');
        assert.equal(typeof analysis.entityAt, 'function');
    });

    describe('#getScopes', () => {
        let scopes;
        before(() => {
            scopes = analysis.getScopes();
        });

        it('should return scopes', () => {
            assert.strictEqual(scopes.length, 6);
            assert.strictEqual(scopes[0].loc.start.line, 1);
            assert.strictEqual(scopes[0].loc.end.line, 100);
            assertSameLoc(scopes[0].loc, [1, 0, 100, 0]);
            assertSameLoc(scopes[1].loc, [2, 15, 18, 1]);
            assertSameLoc(scopes[2].loc, [7, 14, 13, 5]);
            assertSameLoc(scopes[2].parent.loc, [2, 15, 18, 1]);
            assertSameLoc(scopes[3].loc, [8, 8, 9, 9]);

            assertSameLoc(scopes[5].loc, [21, 11, 32, 5]);

            assert.equal(scopes[0].isFunctionScope, true);
            assert.equal(scopes[1].isFunctionScope, true);
            assert.equal(scopes[2].isFunctionScope, false);
            assert.equal(scopes[5].isFunctionScope, true);
        });
    });

    describe('result of calling #entityAt at const declarator', () => {
        let entity;
        before(() => {
            entity = analysis.entityAt({
                line: 10,
                column: 16
            });
        });

        it('should have proper `loc`', () => {
            assert.strictEqual(entity.name, 'abc');
            assertSameLoc(entity.loc, [10, 14, 10, 17]);
        });

        it('should have proper `kind`', () => {
            assert.strictEqual(entity.kind, 'const');
        });


        it('should have proper scope info', () => {
            assert(entity.scope);
            assertSameLoc(entity.scope.loc, [7, 14, 13, 5]);
        });
    });

    describe('result of calling #entityAt at var declarator', () => {
        let entity;
        before(() => {
            entity = analysis.entityAt({
                line: 11,
                column: 12
            });
        });

        it('should have proper `loc`', () => {
            assert.strictEqual(entity.name, 'def');
            assertSameLoc(entity.loc, [11, 12, 11, 15]);
        });

        it('should have proper `kind`', () => {
            assert.strictEqual(entity.kind, 'var');
        });

        it('should have proper scope info', () => {
            assert(entity.scope);
            assertSameLoc(entity.scope.loc, [2, 15, 18, 1]);
        });
    });

    describe('result of calling #entityAt at `let` declarator in `for` loop', () => {
        let entity;
        before(() => {
            entity = analysis.entityAt({
                line: 8,
                column: 17
            });
        });

        it('should have proper `loc`', () => {
            assert.strictEqual(entity.name, 'i');
            assertSameLoc(entity.loc, [8, 17, 8, 18]);
        });

        it('should have proper scope info', () => {
            assert(entity.scope);
            //assertSameLoc(entity.scope.loc, [8, 37, 9, 9]);
            assertSameLoc(entity.scope.loc, [8, 8, 9, 9]);
        });

    });
});


describe('Analyzer (chains)', () => {

    let analyzer;
    let ast;
    let analysis;
    beforeEach(() => {
        ast = parse(chainCode);
        analyzer = new Analyzer();
        analysis = analyzer.analyze(ast);
    });

    it('should analyze chains', () => {
        //assert.strictEqual(analysis.refs.length, 3);
        console.log("REEE", analysis.refs);

        const mapped = analysis.refs.map(ref => ref.map(link => link.key))

        let index = 0; let index2;
        assert.deepEqual(mapped[index++], ['a', '.', 'b', '.', 'c']);
        assert.deepEqual(mapped[index++], ['foo']);
        assert.deepEqual(mapped[index++], ['d', '.', 'e', '.', 'f']);
        assert.deepEqual(mapped[index++], ['a']);
        assert.deepEqual(mapped[index++], ['j', '.', 'k', '.', 'l']);
        assert.deepEqual(mapped[index++], ['g', '.', 'h', '.', 'i', '()']);
        assert.deepEqual(mapped[index++], ['foo', '.', 'bar']);
        assert.deepEqual(mapped[index++], ['gummi', '.', 'bear']);
        assert.deepEqual(mapped[index++], ['bunny']);
        assert.deepEqual(mapped[index++], ['m', '.', 'n', '.', 'o', '()', '.', 'p']);

        index2 = index++;
        let inIf = mapped[index2];
        assert.deepEqual(inIf, ['kotek']);
        //assert.equal(analysis.refs[index2]);



        assertSameLoc(analysis.refs[0][0].loc, [6, 8, 6, 9]);
        assertSameLoc(analysis.refs[0][0].scope.loc, [5, 14, 7, 5]);

        let ref = analysis.refAt({
            line: 6,
            column: 8
        });

        assert.strictEqual(ref[0].key, 'a');
        assertSameLoc(ref[0].loc, [6, 8, 6, 9]);
        assertSameLoc(ref[0].scope.loc, [5, 14, 7, 5]);

        assertSameLoc(analysis.refs[1][0].loc, [10, 8, 10, 11]);
        assertSameLoc(analysis.refs[1][0].scope.loc, [9, 11, 11, 5]);


        let def = analysis.resolveRef(analysis.refAt({
            line: 15,
            column: 4
        }));
        assertSameLoc(def.loc, [4, 10, 4, 11]);

        def = analysis.resolveRef(analysis.refAt({
            line: 6,
            column: 8
        }));
        assertSameLoc(def.loc, [4, 10, 4, 11]);
        assert.strictEqual(def.props.length, 2);
        assert.equal(def.props[0].name, 'b');
        assertSameLoc(def.props[0].loc, [4, 15, 4, 16]);

        assert.equal(def.props[1].name, 'c');


        ref = analysis.refAt({
            line: 6,
            column: 10
        });
        def = analysis.resolveRef(ref);

        assert.strictEqual(ref.length, 3);

        assertSameLoc(ref[0].loc, [6, 8, 6, 9]);
        assertSameLoc(ref[2].loc, [6, 10, 6, 11]);

        assertSameLoc(def.loc, [4, 15, 4, 16]);

        ref = analysis.refAt({
            line: 6,
            column: 12
        });
        def = analysis.resolveRef(ref);
        assertSameLoc(def.loc, [4, 19, 4, 20]);
    });

});


describe('Education mode', () => {

    let analyzer;
    let ast;
    let analysis;
    beforeEach(() => {
        ast = parse(basicCode);
        analyzer = new Analyzer();
        analysis = analyzer.analyze(ast);
    });

    it('', () => {
        assert.equal(analysis.educationalInfos.length, 5);
        let info;
        info = analysis.educationalInfos[0];
        assert.equal(info.type, 'if-test');
        assertSameLoc(info.loc, [7, 8, 7, 12]);
        info = analysis.educationalInfos[1];
        assert.equal(info.type, 'if-consequent');
        assertSameLoc(info.loc, [7, 14, 13, 5]);

        // info = analysis.educationalInfos[2];
        // assert.equal(info.type, 'for');
        // assertSameLoc(info.loc, [8, 8, 9, 9]);
        info = analysis.educationalInfos[2];
        assert.equal(info.type, 'for-init');
        assertSameLoc(info.loc, [8, 13, 8, 22]);

        info = analysis.educationalInfos[3];
        assert.equal(info.type, 'for-test');
        assertSameLoc(info.loc, [8, 24, 8, 30]);

        info = analysis.educationalInfos[4];
        assert.equal(info.type, 'for-update');
        assertSameLoc(info.loc, [8, 32, 8, 36]);

    });
});
