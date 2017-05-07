const Scope = require('./Scope');

function State(analysis) {
    this.analysis = analysis;
    this.blockScopes = [];
    this.functionScopes = [];
    this.forScope = null;
    this.chains = [];
    this.expr = [];
    this.props = [];
    this.path = [];
    this.scopes = [new Scope({
        loc: {
            start: {
                line: 1, column:0
            },
            end: {
                line: 10000, column:0
            }
        }
    })];
    this.ctx = [];
    this.ctx.push({
        name: 'global',
        path: [],
        scope: new Scope({})
    });

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
    },
    popBlockScope() {
        return this.blockScopes.pop();
    },
    pushBlockScope(scope) {
        return this.blockScopes.push(scope);
    },
    popFunctionScope() {
        return this.functionScopes.pop();
    },
    pushFunctionScope(scope) {
        return this.functionScopes.push(scope);
    },
    declareScope(scope) {
        this.analysis.scopes.push(scope);
    },
    declareRef(ref) {
        this.analysis.refs.push(ref);
    }
}, naiveModel1);


module.exports = State;
