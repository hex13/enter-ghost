module.exports = {
    SwitchCase: {
        exit(node, state) {
            const entity = {type: 'case', test: node.test? node.test.value : null};
            state.declareEntity(node, entity);
        }
    }
};
