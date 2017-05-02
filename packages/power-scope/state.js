function State(analysis) {
    this.analysis = analysis;
    this.blockScopes = [];
    this.functionScopes = [];
    this.forScope = null;
    this.chains = [];
    this.expr = [];
    this.props = [];
    this.path = [];
    this.scopes = [];
    this.ctx = [];
}

const naiveModel1 = require('./naiveModel1').stateMixin;

State.prototype = Object.assign({
    prepareFromEstraverse(ctx, node, parent) {
        this.node = node;
        this.parent = parent;
        const path = ctx.__current.path;
        this.key = '';

        if (path instanceof Array) {
            //this.key = path[path.length - 1];
            this.key = path[0];
        } else {
            this.key = path;
        }
    },
    last(arrName) {
        const arr = this[arrName];
        return arr[arr.length - 1];
    }
}, naiveModel1);


module.exports = State;
