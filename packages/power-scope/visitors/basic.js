

"use strict";

const assert = require('assert');
const { getName } = require('lupa-utils');
const Scope = require('../Scope');
const _isFunctionScope = require('../helpers').isFunctionScope;

const log = console.log;
const variableDeclarationVisitor = {
    enter(node, state) {
        let scope;
        if (node.kind == 'var') {
            scope = state.functionScopes[state.functionScopes.length - 1];
        } else {
            scope = state.blockScopes[state.blockScopes.length - 1];
        }

        state.scopes.push(scope);
        state.path.push(getName(node));
    },
    exit(node, state,c) {
        const path = state.path;
        state.scopes.pop();
        state.path.pop();
    },
}


const basicVisitor = {
    ClassDeclaration: {
        exit(node, state) {
            const entity = {
                name: node.id.name,
                scope: state.blockScopes[state.blockScopes.length - 1],
                loc: node.id.loc,
            };
            state.declareVariable(entity);
        }
    },
    ObjectMethod: {
        // TODO remove duplication
        enter(node, state) {
            const ctx = state.enterProperty(node);
            if (!ctx) {
                return;
            }

        },
        exit(node, state) {
            state.declareParamsFrom(node);
            state.exitProperty(node);
        }
    },
    ObjectProperty: {
        // TODO remove duplication
        enter(node, state) {
            state.enterProperty(node);
        },
        exit(node, state) {
            state.exitProperty(node);
        }
    },
    ObjectPattern: {
        enter(node, state) {
            state.enterObject();
        },
        exit(node, state) {
            state.exitObject();
        }

    },
    ObjectExpression: {
        enter(node, state) {
            state.enterObject();

            if (state.parent != (state.last('dev')||{}).owner && state.parent.type != 'ObjectProperty') {
                state.ctx.push(null);
            } else if (state.parent.type != 'ObjectProperty'){
                const ctx = state.last('dev') || {};
                Object.assign(ctx, {
                    path: [],
                    entries: Object.create(null),
                    scope: state.scopes[state.scopes.length - 1]
                })
                state.ctx.push(ctx);
            }
        },
        exit(node, state) {

            state.exitObject();
            // TODO create each time object with own "scope" of flatten properties, like this
            // {
            //   props: {'a':3, 'a.b': 3, 'a.b.c':4  }
            //
            //}
            // then push as expression to stack
            // `this` will be defined even without real scope

            if (state.parent != (state.last('dev')||{}).owner && state.parent.type != 'ObjectProperty') {
                state.ctx.pop();
            } else if (state.parent.type != 'ObjectProperty'){
                state.last('ret').value = state.ctx.pop();
            }
        }
    },
    Scope: {
        enter(node, state) {
            const parent = state.parent;
            const isFunctionScope = _isFunctionScope(node, parent);
            const scope = new Scope({
                loc: node.loc,
                isFunctionScope,
                parentType: state.parent.type,
                parent: state.blockScopes[state.blockScopes.length - 1],
            });
            state.declareScope(scope);
            state.pushBlockScope(scope);
            if (isFunctionScope) {
                state.pushFunctionScope(scope)
            }
        },
        exit(node, state) {
            const scope = state.popBlockScope();
            state.poppedScope = scope;
            if (state.parent.type == 'ForStatement') {
                //state.forScope = scope;
            }
            const parent = state.parent;

            const isFunctionScope = _isFunctionScope(node, parent);
            if (isFunctionScope) {
                state.popFunctionScope();
            }

        }
    },
    ForStatement: {
        enter(node, state) {
            if (node.init && node.init.type == 'VariableDeclaration')
                variableDeclarationVisitor.enter(node.init, state, 'kotek');
        },
        exit(node, state) {

            //state.blockScopes.push(state.forScope);
            if (node.init && node.init.type == 'VariableDeclaration')
                variableDeclarationVisitor.exit(node.init, state, 'kotek');
            //state.blockScopes.pop();
        }
    },
    Function: {
        enter(node, state) {
            const scope = new Scope({
                loc: node.loc,
                isFunctionScope: true,
                nodeType: node.type,
                parent: state.blockScopes[state.blockScopes.length - 1],
            });
            const func = {
                name: getName(node),
                loc: (node.id || node.key || node).loc,
                scope: state.blockScopes[state.blockScopes.length - 1],
                nodeId: state.nodeId,
            };
            state.pushFunction(func);
            state.declareScope(scope);
            state.pushBlockScope(scope);
            state.pushFunctionScope(scope);
        },
        exit(node, state) {
            state.declareParamsFrom(node);
            state.popFunctionScope();
            state.popBlockScope();
            const func = state.popFunction();
            if (node.type == 'FunctionDeclaration') {
                state.declareVariable(func);
            }

        }
    },
    FunctionExpression: {
        enter(node, state) {
            // TODO this is ugly
            if (state.parent.type != 'ObjectProperty')
                state.ctx.push(0);
        },
        exit(node, state) {
            // TODO this is ugly
            if (state.parent.type != 'ObjectProperty')
                state.ctx.pop();
        },
    },
    FunctionDeclaration: {
        enter(node, state) {
            state.ctx.push(0);
        },
        exit(node, state) {
            state.ctx.pop();
        },
    },
    VariableDeclaration: variableDeclarationVisitor,
    VariableDeclarator: {
        enter(node, state) {
            state.ret.push({});

            if (node.id.type == 'ObjectPattern') {
                return;
            }

            state.dev.push({
                name: getName(node),
                owner: node,
            });

        },
        exit(node, state) {
            const expr = state.expr.pop();
            const dev = state.dev.pop();
            const ret = state.ret.pop();
            if (!ret) {
                console.error('err', node);
            }

            if (ret.value && ret.value.entries) {
                Object.keys(ret.value.entries).forEach(key => {
                    const entry = ret.value.entries[key];

                    entry.scope = state.scopes[state.scopes.length - 1],
                    state.declareVariable(entry, null, key);
                });
            }

            if (node.id.type == 'ObjectPattern') {
                node.id.properties.forEach(prop => {
                    //const fixture = Object.assign({}, expr);
                    let origin;
                    const prefix = (expr && expr.origin.name && (expr.origin.name + '.')) || '';
                    if (expr && expr.origin) {
                        origin = {
                            name: prop.key.name,
                            path: expr.origin.path,
                        };
                    }
                    state.declareVariable({
                        name: getName(prop),
                        loc: prop.key.loc,
                        scope: state.scopes[state.scopes.length - 1],
                        origin,
                    });
                });
                return;
            }


            const name = getName(node);
            //console.log("EEEE",expr)
            state.declareVariable({
                name,
                loc: node.id.loc,
                scope: state.scopes[state.scopes.length - 1],
            }, expr);

        //    state.ctx.pop();
        }
    },
    ImportDeclaration: {
        enter(node, state) {
            const source = node.source.value;
            node.specifiers.forEach(specifier => {
                const loc = specifier.local.loc;
                state.declareVariable({
                    name: specifier.local.name,
                    loc,
                    scope: state.blockScopes[state.blockScopes.length - 1],
                    origin: {
                        path: source,
                        name: specifier.imported && specifier.imported.name,
                        importDefault: specifier.type == 'ImportDefaultSpecifier',
                    }
                });

            });
        },
        exit(node, state) {
        }
    },
    ExportNamedDeclaration: {
        enter(node, state) {
            //state.analysis.setComponent('file', 'exports.' + name);
            //state.pushExport();

        },
        exit(node, state) {
            let variable = global.nodeMap.get(node.declaration);
            if (variable) {
                state.analysis.setComponent('file', 'exports.' + variable.name, variable);
            }
            //state.pop();
        }
    }

};

module.exports = Object.assign(basicVisitor, require('./refs'));
