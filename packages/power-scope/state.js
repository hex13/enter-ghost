function State(analysis) {
    this.analysis = analysis;
    this.blockScopes = [];
    this.functionScopes = [];
    this.forScope = null;
    this.chains = [];
    this.expr = [];
    this.props = [];
}

State.prototype = {
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
    }
};


module.exports = State;
