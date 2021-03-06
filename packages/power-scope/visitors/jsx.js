let functions = [];
module.exports = {
    FunctionDeclaration: {
        enter(node, state) {
            functions.push(state.nodeId);
        },
        exit(node, state) {
            functions.pop();
        }
    },

    ClassMethod: {
        enter(node, state) {
            functions.push(state.nodeId);
        },
        exit(node, state) {
            functions.pop();
        }
    },
    JSXElement: {
        enter(node, state) {
            // const funcId = functions[functions.length - 1];
            // state.analysis.setComponent(funcId, 'jsx', true);
            //console.log("YYYY ID:   ___", functions, state.analysis.getComponent(funcId, 'jsx'));
        },
        exit(node, state) {
        }
    },
    JSXIdentifier: {
        enter(node, state) {
            const func = state.last('functions');
            if (func) {
                let jsx = state.analysis.getComponent(func.nodeId, 'jsx');
                if (!jsx) jsx= {uses: {}};
                if (node.name[0].toUpperCase() == node.name[0]) {
                    jsx.uses[node.name] = 1;
                }
                state.analysis.setComponent(func.nodeId, 'jsx', jsx);
                //func.jsx = jsx;


                //require('assert').equal(nodeId, func.nodeId)

            }

            state.declareRef([
                {
                    isChain: true,
                    loc: node.loc,
                    key: node.name,
                    scope: state.blockScopes[state.blockScopes.length - 1],
                }
            ]);
        },
        exit(node, state) {
        }
    }
};
