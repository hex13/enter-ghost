const { getName } = require('lupa-utils');
const _isFunctionScope = require('../helpers').isFunctionScope6;


function ObjectRepr() {
    this.props = Object.create(null);
}

function Binding(identifier, value) {
    this.name = identifier.name;
    this.loc = identifier.loc;
    this.value = value;
}

Binding.prototype = {
    get props() {
        return this.value.props;
    }
};

module.exports = () => {
    return Object.assign({
        Program: {
            enter(node, state) {
                state.objects = [];
                state.analysis.objects = [];
                state.analysis.declarators = [];
                state.analysis.arrays = [];
                state.analysis.thisMap = new WeakMap;
                state.thisMap = state.analysis.thisMap;
            }
        },
        ObjectExpression: {
            enter(node, state) {
                //const obj = {};
                const obj = new ObjectRepr();
                state.objects.push(obj);
            },
            exit(node, state) {
                const obj = state.objects.pop();
                const isObjectRoot = state.parent.type != 'ObjectProperty';
                if (isObjectRoot) {
                    state.analysis.objects.push(obj);
                }
                state.passValue(obj);
            }
        },
        Function: {
            enter(node, state) {

            },
            exit(node, state) {
                const func = {};
                state.passValue(func);
                state.assignThis(func, state.lastOf('objects'));
            }
        },
        ObjectMethod: {
            enter(node, state) {

            },
            exit(node, state) {
                console.log("XXXXXX",getName(node))
                const meth = {};

                const obj = state.lastOf('objects');
                state.assignThis(meth, obj);
                state.bindProperty(obj, new Binding(node.key, meth));

                // TODO api proposal:
                // const obj = state.currentObject;
                // state.assignThis(meth, obj);
                // state.setProperty(obj, getName(node), meth);

            }
        },
        ObjectProperty: {
            enter: (node, state) => state.expectValue(),
            // TODO api proposal:
            //expectValue: true,
            exit(node, state) {
                state.bindProperty(state.lastOf('objects'), new Binding(node.key, state.receiveValue()));
            }
        },
        //declarators
        VariableDeclarator: {
            enter(node, state) {
                const decl = {
                    kind: state.parent.kind,
                    name: node.id.name
                };
                // TODO check maybe push/pop can be replaced with mapping AST node id to value(s)
                state.analysis.declarators.push(decl);
                state.decl.push(decl);
                state.expectValue();
            },
            exit(node, state) {
                const decl = state.decl.pop();
                decl.init = state.receiveValue();
                state.last('blockScopedDecl').values.push(decl);
                state.last('blockScopes').declarations.push(decl);
            },
        },
        NumericLiteral: {
            enter(node, state) {

            },
            exit(node, state) {
                state.passValue({value: node.value});
            },
        },
        // arrays
        ArrayExpression: {
            enter(node, state) {
                state.expectValues();
            },
            exit(node, state) {
                state.analysis.arrays.push(state.receiveValues())
            },
        },

        Scope6: {
            enter(node, state) {
                const isFunctionScope = _isFunctionScope(node, state.parent);
                const loc = node.loc;
                const scope = {
                    isFunctionScope,
                    range: [
                        loc.start.line,
                        loc.start.column,
                        loc.end.line,
                        loc.end.column,
                    ],
                    vars: Object.create(null),
                    declarations: [

                    ]
                };
                state.analysis.scopes.push(scope);
                state.blockScopedDecl.push({values: []});
                state.blockScopes.push(scope);
            },
            exit(node, state) {
                const scope = state.blockScopes.pop();
                scope.declarations.forEach(decl => {
                    scope.vars[decl.name] = {
                        value: decl.init
                    };
                });
                state.blockScopedDecl.pop();
            }
        }
    }, require('./refs'));
};
