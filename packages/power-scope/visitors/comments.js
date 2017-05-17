module.exports = {
    FunctionDeclaration: {
        enter(node, state) {
            if (node.leadingComments) {
                console.log(" S E USTAWIWMAMAA ", state.nodeId);
                state.analysis.setComponent(state.nodeId, 'comment',  node.leadingComments[0].value);
            }
        }
    }
};
