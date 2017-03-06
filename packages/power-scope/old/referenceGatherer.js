const { unknown } = require('./symbols');
const utils = require('lupa-utils');
const { getName, analyzeChain } = utils;

const visitor = ({
    MemberExpression: {
        enter({node}, state) {

        },
        exit({node}, state) {
            const chain = analyzeChain(node);
            //console.log("CZAIN", getName(node));
        },
    },
    Scope: {
        exit({node}, state) {
            //console.log("SCC", state.result)
        }
    },
    default: {
        enter() {

        },
        exit() {

        }
    }
});
module.exports = visitor;
