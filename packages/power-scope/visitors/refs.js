const { getName } = require('lupa-utils');

module.exports = {
    MemberExpression: {
        exit(node, state) {
            const chain = state.chains[state.chains.length - 1];
            if (node.object.type == 'Identifier') {
                chain.push({
                    isChain: true,
                    key: getName(node.object),
                    scope: state.blockScopes[state.blockScopes.length - 1],
                    loc: node.object.loc
                });
            }
            if (node.object.type == 'ThisExpression') {
                chain.push({
                    isChain: true,
                    key: 'this',
                    scope: state.blockScopes[state.blockScopes.length - 1],
                    loc: node.object.loc
                });
            }
            chain.push({
                key: '.'
            });
            chain.push({
                key: getName(node.property),
                loc: node.property.loc
            })
        },
        enter(node, state) {

        }
    },
    Identifier: {
        enter(node, state) {
        },
        exit(node, state) {
            const key = state.key;
            if (key == 'expression' || key == 'arguments' || key == 'test' || key == 'left' || key == 'argument' || key == 'right' || key == 'init') {
                state.declareRef([{
                    isChain: true,
                    key: getName(node),
                    loc: node.loc,
                    scope: state.blockScopes[state.blockScopes.length - 1]
                }]);
            }
        }
    },
    ThisExpression: {
        enter(node, state) {
        },
        exit(node, state) {
            const key = state.key;
            if (key == 'expression' || key == 'arguments' || key == 'test' || key == 'left' || key == 'argument' || key == 'right' || key == 'init') {
                state.declareRef([{
                    isChain: true,
                    key: 'this',
                    loc: node.loc,
                    scope: state.blockScopes[state.blockScopes.length - 1]
                }]);
            }
        }
    },
    CallExpression: {
        enter(node, state) {
            //state.ctx.push(null);
            if (node.callee.type == 'Identifier') {
                state.declareRef([{
                    isChain: true,
                    key: getName(node.callee),
                    loc: node.callee.loc,
                    scope: state.blockScopes[state.blockScopes.length - 1]
                }]);

            }
        },
        exit(node, state) {
            if (node.callee.name == 'require' && node.arguments[0])
                state.expr.push({
                    origin: {
                        name: '',
                        path: node.arguments[0].value
                    }
                });
            //state.ctx.pop();
            // state.chains[state.chains.length - 1].push({
            //     key: '()'
            // });
        }
    },
    ChainEnd: {
        enter(node, state) {
            const chain = [];
            state.chains.push(chain);
        },
        exit(node, state) {
            const ref = state.chains.pop();
            if (ref.length) {
                state.declareRef(ref);
            }
        },
    },
};
