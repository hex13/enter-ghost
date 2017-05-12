const names = Object.create(null);

module.exports = {
    Identifier: {
        exit(node, state) {
            const previous = state.analysis.getComponent(state.nodeId, 'provider');
            names[state.nodeId] = previous;
        }
    },
    Program: {
        exit(node, state) {
            state.analysis.setComponent('names', 'receiver', Object.keys(names).map(k=>names[k]));
            state.analysis.setComponent(undefined, 'receiver', 'no node');
        }
    }
};
