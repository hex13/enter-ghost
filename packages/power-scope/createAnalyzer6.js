const Analyzer = require('./analyzer');
const State = require('./state')(require('./analysisBuilder6'));
const sixVisitor = require('./visitors/6.js')({

});

module.exports = function createAnalyzer() {
    return new Analyzer({visitors: [sixVisitor], State, postprocess: false});
}
