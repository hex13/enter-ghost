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
        console.error("POP", getName(node))
        state.scopes.pop();
        state.path.pop();
    },
}


module.exports = {
    ObjectMethod: {
        // TODO remove duplication
        enter(node, state) {
            const ctx = state.last('ctx');
            if (!ctx) {
                return;
            }
            ctx.path.push(getName(node));


            const scope = new Scope({
                loc: node.loc,
                isFunctionScope: true,
                parent: state.blockScopes[state.blockScopes.length - 1],
            });
            state.declareScope(scope);
            state.pushBlockScope(scope); // blockScopes are for setting parent in child scope
            state.pushFunctionScope(scope);
            console.error("ObectMethod enter", state.functionScopes.length)

        },
        exit(node, state) {
            console.error("ObjectMethod ExIT", getName(node), state.functionScopes.length)
            state.declareParamsFrom(node);
            state.popBlockScope();
            state.popFunctionScope();

            const name = getName(node);
            const ctx = state.last('ctx');
            if (!ctx) return;

            state.declareProperty(ctx, {
                name,
                loc: node.key.loc,
            });

            ctx.path.pop();
        }
    },
    ObjectProperty: {
        // TODO remove duplication
        enter(node, state) {
            const ctx = state.last('ctx');
            if (!ctx) return;
            ctx.path.push(getName(node));
            console.log("PROOOOOP", ctx, getName(node))
        },
        exit(node, state) {
            const name = getName(node);

            const ctx = state.last('ctx');
            if (!ctx) return;


            state.declareProperty(ctx, {
                name,
                loc: node.key.loc,
            });

            ctx.path.pop();
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
        },
        exit(node, state) {
            state.exitObject();
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
    CallExpression: {
        enter(node, state) {
            state.ctx.push(null);
            console.log("REJESTRACJA X@) #)#)#)  ## )", getName(node.callee))
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
            state.ctx.pop();
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
    FunctionDeclaration: {
        enter(node, state) {
            const scope = new Scope({
                loc: node.loc,
                isFunctionScope: true,
                parent: state.functionScopes[state.functionScopes.length - 1],
            });
            state.declareScope(scope);
            state.pushBlockScope(scope);
            state.pushFunctionScope(scope);
        },
        exit(node, state) {
            state.declareParamsFrom(node);
            state.popFunctionScope();
            state.popBlockScope();
            state.declareVariable({
                name: node.id.name,
                loc: node.id.loc,
                scope: state.blockScopes[state.blockScopes.length - 1],
            });
        }
    },
    VariableDeclaration: variableDeclarationVisitor,
    VariableDeclarator: {
        enter(node, state) {
            state.ctx.push({
                name: getName(node),
                path: [],
                scope: state.scopes[state.scopes.length - 1]
            });
            console.log("=".repeat(20))
        },
        exit(node, state) {
            const expr = state.expr.pop();
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

};
