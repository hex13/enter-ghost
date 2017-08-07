const api = require('./stateContainer').init();

module.exports = function createReflection() {
    return {
        dispatch(action) {
            this.devTools.action(action);
        },
        devTools: api.model({
            data: {
                actions: () => []
            },
            actions: {
                inspect(state, model) {

                },
                action(state, action) {
                    state.actions.push(action);
                }
             }
        })
    }
}
