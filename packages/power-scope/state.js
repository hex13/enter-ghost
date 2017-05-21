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
    this.nodeId = 0;
    this.functions = [];
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
    declareScope(scope) {
        //console.log("<div style='color:red'>", scope.nodeType, this.ctx[this.ctx.length -2],"</div>")
        const ctx = this.last('ctx');
        //const ctx = (scope.parentType) == 'ArrowFunctionExpression' ? this.ctx[this.ctx.length - 2] : this.last('ctx');
        //console.log('<br/><b>',scope.loc.start.line,scope.loc.start.column, ' ', ctx && ctx.name, '----', ctx && ctx.path.join('.'), '</b>');
        if (scope.parentType == 'ArrowFunctionExpression' && scope.parent && scope.parent.parent) {
            let curr = scope.parent.parent;
            scope.thisPath = curr.thisPath;
            scope.thisScope = curr.thisScope;
        }
        else if (ctx) {
            scope.thisPath = ctx.name;
            scope.thisScope = ctx.scope;
            if (ctx.path.length > 1 ) {
                scope.thisPath += '.' + ctx.path.slice(0, -1).join('.');
            }
        }
        this.analysis.scopes.push(scope);
    },
    declareRef(ref) {
        this.analysis.refs.push(ref);
    },
    declareEntity(node, entity) {
        this.customEntities.push({node, entity});
    }
}, naiveModel1);

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


module.exports = State;
