const { getName } = require('lupa-utils');
module.exports = {
    ExportNamedDeclaration: {
        enter(node, state) {
            const name = getName(node);
            const exports = state.analysis.getComponent('file', 'exports') || [];
            exports.push(name);
            state.analysis.setComponent('file', 'exports', exports);
            state.analysis.getComponent('file', 'exports') || [];

            

            // TODO API proposal:
            // state.component('file', 'exports').create()
            // state.component('file', 'exports').push(getName(node));
            // state.component('file', 'exports').update('new value');
            // state.component('file', 'exports').remove();


        },
    }
};
