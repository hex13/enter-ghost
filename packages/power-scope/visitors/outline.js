module.exports = {
    Program: {
        enter(node, state) {
            state.analysis.outline = {
                type: 'file',
                children: [],
            };
            state.outlineNodes = [state.analysis.outline];
        },
        exit(node, state) {

        },
    },
    ClassDeclaration: {
        enter(node, state) {
            // HERE!!
            const outlineNode = {
                type: 'class',
                name: node.id.name,
                children: []
            };
            state.last('outlineNodes').children.push(outlineNode);
            state.outlineNodes.push(outlineNode);

        },
        exit(node, state) {
            state.outlineNodes.pop();
        },
    },
    ClassMethod: {
        enter(node, state) {
            const outlineNode = {type: 'method', name: node.key.name, children: []};
            state.last('outlineNodes').children.push(outlineNode);
            state.outlineNodes.push(outlineNode);
        },
        exit(node, state) {
            state.outlineNodes.pop();
        },
    },
    VariableDeclarator: {
        enter(node, state) {
            const outlineNode = {type: 'variable', name: node.id.name, children: []};
            state.last('outlineNodes').children.push(outlineNode);
            state.outlineNodes.push(outlineNode);
        },
        exit(node, state) {
            state.outlineNodes.pop();
        },
    }
};
