const { getName } = require('lupa-utils');
const createAssignComponents = components => (analysis, nodeId, target) => {
    components.forEach(componentName => {
        const component = analysis.getComponent(nodeId, componentName);
        if (component) {
            console.log("ASSIGNING", componentName, component)
            target[componentName] = component;
        }
    });
}


module.exports = function ({components}) {
const assignComponents = createAssignComponents(components);
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
    Function: {
        enter(node, state) {
            if (node.type == 'FunctionExpression') {
                if (state.parent.type == 'VariableDeclarator') {
                    state.last('outlineNodes').type = 'function';
                }
                return;
            }
            const outlineNode = {type: 'function', name: getName(node), children: []};
            state.enterOutlineNode(outlineNode);
        },
        exit(node, state) {
            if (node.type == 'FunctionExpression') {
                return;
            }
            const outlineNode = state.exitOutlineNode();
            assignComponents(state.analysis, state.nodeId, outlineNode);
            // TODO API change proposal:
            // state.assignComponents(outlineNode, components);
            // method assignComponents(target, components);
        }
    },
    VariableDeclarator: {
        enter(node, state) {
            state.enterOutlineNode({type: 'variable', name: getName(node), children: []});
        },
        exit(node, state) {
            state.exitOutlineNode();
        },
    }
};
};
