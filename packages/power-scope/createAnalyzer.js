const Analyzer = require('.');
const basicVisitor = require('/Users/lukasz/sandbox/enter-ghost/packages/power-scope/visitors/basic');
const jsxVisitor = require('/Users/lukasz/sandbox/enter-ghost/packages/power-scope/visitors/jsx');



const analyzerOpts = {
    visitors: [basicVisitor, jsxVisitor]
}

module.exports = function createAnalyzer() {
    return new Analyzer(analyzerOpts);
}
