

const { getName } = require('lupa-utils');
const _isFunctionScope = require('../helpers').isFunctionScope6;
const assert = require('assert');
const {servicesAutumn: services} = require('../createQueryAutumn');

const NA = Symbol('N/A');

function loc2range(loc) {
    return [
        loc.start.line,
        loc.start.column,
        loc.end.line,
        loc.end.column,
    ];
}

function ObjectModel () {
    this.props = Object.create(null);
    this.type = 'object';
}
ObjectModel.prototype.createProperty = function (node, value) {
    const key = getName(node);
    this.props[key] = new Binding(node, value);
}

ObjectModel.prototype.getPropertyNames = function () {
    return Object.keys(this.props);
}

ObjectModel.prototype.toJS = function () {
    function visit(obj) {
        if (obj === NA) return '???';
        if (typeof obj != 'object') return obj;
        const res = {};
        Object.keys(obj.props).forEach(name => {
            res[name] = visit(obj.props[name].value);
        });
        return res;
    }
    return visit(this);
}

function ExprModel() {
    return {
        type:'expr',
        value: NA
    };
}

function Binding(identifier, value) {
    this.name = identifier.name;
    this.range = loc2range(identifier.loc);
    this.value = value;
    this.backRefs = [];
}

Binding.prototype = {
    // get props() {
    //     return this.value.props;
    // }
};

class FunctionModel {
    constructor() {
        this.type = 'function';
        this.ret = [];
    }
}

const last = (arr) => arr[arr.length - 1];

const ObjectExpressionHandler = {
    enter(node, state) {
        const obj = new ObjectModel();
        state.objects.push(obj);
    },
    exit(node, state) {
        const obj = state.objects.pop();
        last(state.expr).value = obj;
        last(state.expr).a = 'ku'
    }
};

const ObjectPatternHandler = {
    enter(node, state) {
        const obj = new ObjectModel();
        state.objects.push(obj);
    },
    exit(node, state) {
        const obj = state.objects.pop();
        state.objPatterns.push(obj);
        state.models.set(node, obj);
    }
}

const ObjectPropertyHandler = {
    enter: (node, state) => {
        const expr = new ExprModel
        state.expr.push(expr);
        state.tmpProp = state.tmpProp || [];
        state.tmpProp.push(expr);
    },
    exit(node, state) {

        const expr = state.tmpProp.pop();
        state.expr.pop();
        last(state.objects).createProperty(node.key, expr.value);
    }
};

module.exports = () => {
    return Object.assign({
        Program: {
            enter(node, state) {
                state.objects = [];
                state.values = [];
                state.objPatterns = [];
                state.models = new WeakMap;
                state.vars = [];
                state.scopez = [];//[{scopes: [], a:'program', refs: [], vars: [] }];
                state.blockScopes = state.scopez;
            },
            exit(node, state) {
                assert.strictEqual(state.objects.length, 0);
                assert.strictEqual(state.values.length, 0);
                const analysis = state.analysis;
            }
        },
        ObjectExpression: ObjectExpressionHandler,
        ObjectPattern: ObjectPatternHandler,
        ObjectProperty: ObjectPropertyHandler,
        ObjectMethod: ObjectPropertyHandler,
        //declarators
        VariableDeclarator: {
            enter(node, state) {
                state.expr.push(new ExprModel);
            },
            exit(node, state) {
                const expr = state.expr.pop();
                const scope = last(state.scopez);
                if (node.id.type == 'ObjectPattern') {
                    let objPattern = state.models.get(node.id);
                    const names = objPattern.getPropertyNames();
                    names.forEach(name => {
                        assert(objPattern.props[name].backRefs,'bez aser')
                        scope.vars.push(objPattern.props[name])
                    });
                } else {
                    const binding = new Binding(node.id, expr.value);
                    assert(binding.backRefs);//console.error("NEW Binding", binding.value)
                    scope.vars.push(binding);
                }
            },
        },
        Function: {
            enter(node, state) {
                // TODO tmpScopes is because of lack of reverse ordering during
                // exit.
                state.tmpScopes = state.tmpScopes  || [];
                state.tmpScopes.push(last(state.scopez));
                state.functions.push(new FunctionModel());
                last(state.expr).value = last(state.functions);
            },
            exit(node, state) {
                const scope = state.tmpScopes.pop();
                node.params.forEach(param => {
                    if (param.type == 'ObjectPattern') {
                        let objPattern = state.models.get(param);

                        const names = objPattern.getPropertyNames();
                        names.forEach(name => {
                            scope.vars.push(objPattern.props[name])
                        });
                    } else
                        scope.vars.push(new Binding(param, NA));
                });
                const func = state.functions.pop();
                func.ownScope = scope.scopes[0];
                last(state.expr).value = func;
                if (node.type == 'FunctionDeclaration') {
                    scope.parent.vars.push(new Binding(node.id, func));
                }
            }
        },
        ReturnStatement: {
            enter(node, state) {
                state.expr.push(new ExprModel);
            },
            exit(node, state) {
                //console.log('expr=',)
                last(state.functions).ret.push(state.expr.pop().value)
            },

        },
        // ObjectMethod: {
        //     enter(node, state) {

        //     },
        //     exit(node, state) {
        //     }
        // },

        NumericLiteral: {
            enter(node, state) {

            },
            exit(node, state) {
            },
        },
        // arrays
        ArrayExpression: {
            enter(node, state) {
            },
            exit(node, state) {
            },
        },

        ScopeAutumn: {
            enter(node, state) {
                const loc = node.loc;
                const scope = {
                    nodeType: node.type,
                    vars: [],
                    scopes: [],
                    range: [loc.start.line, loc.start.column, loc.end.line, loc.end.column],
                    refs: [],
                    parent: last(state.scopez),
                };
                state.scopez.push(scope);
                state.scopeIndent = state.scopeIndent || 0;
                state.scopeIndent++;
                state.refs = scope.refs;
                //this.scopez[this.scopez.length - 1].
                //state.logIndented(1+state.scopeIndent, 'V:', chalk.blue(state.vars.map(v=>v.name).join(' ')));
            },
            exit(node, state) {
                state.scopeIndent--;
                if (node.type == 'Program') return
                const scope = state.scopez.pop();

                if (state.scopez.length) {
                    state.refs = state.scopez[state.scopez.length - 1].refs;
                    last(state.scopez).scopes.push(scope)
                }
            }
        }
    }, require('./refs'));
};
