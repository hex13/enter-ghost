let functions = [];
module.exports = {
    FunctionDeclaration: {
        enter(node, state) {
            console.log("KLAS METHOD")
            functions.push(state.nodeId);
        },
        exit(node, state) {
            console.log("------KLAS METHOD")
            functions.pop();
        }
    },

    ClassMethod: {
        enter(node, state) {
            console.log("KLAS METHOD")
            functions.push(state.nodeId);
        },
        exit(node, state) {
            console.log("------KLAS METHOD")
            functions.pop();
        }
    },
    JSXElement: {
        enter(node, state) {
            const funcId = functions[functions.length - 1];
            state.analysis.setComponent(funcId, 'jsx', true);
            //console.log("YYYY ID:   ___", functions, state.analysis.getComponent(funcId, 'jsx'));
        },
        exit(node, state) {
        }
    },
    JSXIdentifier: {
        enter(node, state) {
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
