module.exports = function ({components}) {
return {
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
                return state.outlineNodes.pop();
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
    // TODO maybe function virtual type?
    ClassMethod: {
        enter(node, state) {
            const outlineNode = {type: 'method', name: node.key.name, children: []};
            state.enterOutlineNode(outlineNode);
        },
        exit(node, state) {
            const outlineNode = state.exitOutlineNode();

            components.forEach(componentName => {
                const component = state.analysis.getComponent(state.nodeId, componentName);
                if (component) {
                    outlineNode[componentName] = component;
                }
            });
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
};
