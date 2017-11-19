const Scope = require('./Scope');

module.exports = (analysisBuilder) => {
    function State(analysis) {
        this.analysis = analysis;
        this.blockScopes = [];
        this.functionScopes = [];
        this.forScope = null;
        this.chains = [];
        this.expr = [{value: '???'}];
        this.decl = [];
        this.props = [];
        this.path = [];
        this.nodeId = 0;
        this.functions = [];
        this.dev = [];
        this.ret = [{}];
        this.blockScopedDecl = [];
        this.functionScopedDecl = [];
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
        this.customEntities = [];
    }


    State.prototype = Object.assign({
        declareRef(ref) {
            if (this.refs) {
                this.refs.push(ref);
            } else {
                this.analysis.refs.push(ref);
            }

        },
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
        // alias of `last`
        lastOf(arrName) {
            const arr = this[arrName];
            return arr[arr.length - 1];
        },
        popBlockScope() {
            return this.blockScopes.pop();
        },
        pushFunction(func) {
            return this.functions.push(func);
        },
        popFunction() {
            return this.functions.pop();
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
    }, analysisBuilder);

    function wrap(obj, prop, func) {
        const original = obj[prop];
        obj[prop] = function (...args) {
            func.apply(this, args);
            original.apply(this, args);
        };
    }
    // wrap(State.prototype, 'declareScope', function (scope) {
    //     console.log(
    //         '<h3>scope at ',
    //         scope.loc.start.line + ':' + scope.loc.start.column,
    //         '(parent at ',
    //         scope.parent && (scope.parent.loc.start.line + ':' + scope.parent.loc.start.column),
    //         ') blockScopes by line',
    //         this.blockScopes.map(s => `<em>${s.loc.start.line}</em>`).join(', '),
    //         '</h3>');
    // });

    return State;
}
