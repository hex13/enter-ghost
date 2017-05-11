module.exports = {
    Program: {
        enter(node, state) {
            state.analysis.outline = {
                type: 'file',
                children: [],
            };
            state.outlineNodes = [state.analysis.outline];
            state.enterOutlineNode = (outlineNode) => {
                state.last('outlineNodes').children.push(outlineNode);
                state.outlineNodes.push(outlineNode);
            };
            state.exitOutlineNode = () => {
                state.outlineNodes.pop();
            };
        },
        exit(node, state) {

        },
    },
    ClassDeclaration: {
        enter(node, state) {
            state.enterOutlineNode({
                type: 'class',
                name: node.id.name,
                children: []
            });
        },
        exit(node, state) {
            state.exitOutlineNode();
        },
    },
    ClassMethod: {
        enter(node, state) {
            state.enterOutlineNode({type: 'method', name: node.key.name, children: []});
        },
        exit(node, state) {
            state.exitOutlineNode();
        },
    },
    VariableDeclarator: {
        enter(node, state) {
            state.enterOutlineNode({type: 'variable', name: node.id.name, children: []});
        },
        exit(node, state) {
            state.exitOutlineNode();
        },
    }
};
