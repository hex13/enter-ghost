const names = [];

module.exports = {
    Identifier: {
        exit(node, state) {
            const previous = state.analysis.getComponent(state.nodeId, 'provider');
            names.push({nodeId: state.nodeId, name: previous});
        }
    },
    Program: {
        exit(node, state) {
            state.analysis.setComponent('names', 'receiver', names.map(item => item.name));
            state.analysis.setComponent(undefined, 'receiver', 'no node');
        }
    }
};
