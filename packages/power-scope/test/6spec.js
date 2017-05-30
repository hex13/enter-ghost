const Analyzer = require('../analyzer');
const assert = require('assert');

const { expect } = require('chai');
const fs = require('fs');

const get = require('lodash/get');
const _ = { get };
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


describe('commonJS', () => {

    let analyzer;
    let ast;
    let analysis;
    let scopes;
    before(() => {
        ast = parse(mocks.objects, {sourceType: 'module'});
        analyzer = new Analyzer({visitors: [sixVisitor], State});
        analysis = analyzer.analyze(ast);
    });

    it('should understand CommonJS', () => {
        console.log(inspect(analysis.objects, {depth:null}));
        const obj = analysis.objects[0];

        const props = [
            {path: 'meth', range: [2, 4, 2, 8]},
            {path: 'funcExpr', range: []},
            {path: 'a', range: []},
            {path: 'a.props.a1', range: [9, 8, 9, 10]},
            {path: 'a.props.a1.props.a2', range: [10, 12, 10, 14]},
            {path: 'boo', range: [13, 4, 13, 7]},
        ];

        //expect(obj.props).to.have.deep.keys(props.map(p => p.name));
        props.forEach(({path, range}) => {
            const binding = _.get(obj.props, path);
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

        expect(obj.props).nested.property('a.value.props').to.have.keys('a1');
        expect(obj.props).nested.property('boo.value.props').to.eql({});

        const thisMap = analysis.thisMap;

        assert.equal(thisMap.get(obj.props.meth.value), obj);
        assert.equal(thisMap.get(obj.props.funcExpr.value), obj);
    });
});
