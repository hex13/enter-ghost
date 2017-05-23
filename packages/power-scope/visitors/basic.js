

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


module.exports = {
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

            const scope = new Scope({
                loc: node.loc,
                isFunctionScope: true,
                parent: state.blockScopes[state.blockScopes.length - 1],
            });
            state.declareScope(scope);
            state.pushBlockScope(scope); // blockScopes are for setting parent in child scope
            state.pushFunctionScope(scope);
        },
        exit(node, state) {
            state.declareParamsFrom(node);
            state.popBlockScope();
            state.popFunctionScope();
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
            state.expr.push([]);

            // TODO this is ugly
            if (state.parent.type == 'CallExpression')
                state.ctx.push(null);
        },
        exit(node, state) {
            // TODO this is ugly
            if (state.parent.type == 'CallExpression')
                state.ctx.pop();

            state.exitObject();
            // TODO create each time object with own "scope" of flatten properties, like this
            // {
            //   props: {'a':3, 'a.b': 3, 'a.b.c':4  }
            //
            //}
            // then push as expression to stack
            // `this` will be defined even without real scope
            const expr = state.expr.pop();
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
    MemberExpression: {
        exit(node, state) {
            const chain = state.chains[state.chains.length - 1];
            if (node.object.type == 'Identifier') {
                chain.push({
                    isChain: true,
                    key: getName(node.object),
                    scope: state.blockScopes[state.blockScopes.length - 1],
                    loc: node.object.loc
                });
            }
            if (node.object.type == 'ThisExpression') {
                chain.push({
                    isChain: true,
                    key: 'this',
                    scope: state.blockScopes[state.blockScopes.length - 1],
                    loc: node.object.loc
                });
            }
            chain.push({
                key: '.'
            });
            chain.push({
                key: getName(node.property),
                loc: node.property.loc
            })
        },
        enter(node, state) {

        }
    },
    Identifier: {
        enter(node, state) {
        },
        exit(node, state) {
            const key = state.key;
            if (key == 'expression' || key == 'arguments' || key == 'test' || key == 'left' || key == 'argument' || key == 'right' || key == 'init') {
                state.declareRef([{
                    isChain: true,
                    key: getName(node),
                    loc: node.loc,
                    scope: state.blockScopes[state.blockScopes.length - 1]
                }]);
            }
        }
    },
    ThisExpression: {
        enter(node, state) {
        },
        exit(node, state) {
            const key = state.key;
            if (key == 'expression' || key == 'arguments' || key == 'test' || key == 'left' || key == 'argument' || key == 'right' || key == 'init') {
                state.declareRef([{
                    isChain: true,
                    key: 'this',
                    loc: node.loc,
                    scope: state.blockScopes[state.blockScopes.length - 1]
                }]);
            }
        }
    },
    CallExpression: {
        enter(node, state) {
            //state.ctx.push(null);
            if (node.callee.type == 'Identifier') {
                state.declareRef([{
                    isChain: true,
                    key: getName(node.callee),
                    loc: node.callee.loc,
                    scope: state.blockScopes[state.blockScopes.length - 1]
                }]);

            }
        },
        exit(node, state) {
            if (node.callee.name == 'require' && node.arguments[0])
                state.expr.push({
                    origin: {
                        name: '',
                        path: node.arguments[0].value
                    }
                });
            //state.ctx.pop();
            // state.chains[state.chains.length - 1].push({
            //     key: '()'
            // });
        }
    },
    ChainEnd: {
        enter(node, state) {
            const chain = [];
            state.chains.push(chain);
        },
        exit(node, state) {
            const ref = state.chains.pop();
            if (ref.length) {
                state.declareRef(ref);
            }
        },
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
            if (node.id.type == 'ObjectPattern') {
                return;
            }

            state.ctx.push({
                name: getName(node),
                path: [],
                scope: state.scopes[state.scopes.length - 1]
            });
        },
        exit(node, state) {
            const expr = state.expr.pop();

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

            state.ctx.pop();
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
