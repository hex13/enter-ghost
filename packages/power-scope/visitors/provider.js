module.exports = {
    Identifier: {
        enter(node, state) {
            state.analysis.setComponent(state.nodeId, 'provider', node.name);
        }
    }
};
