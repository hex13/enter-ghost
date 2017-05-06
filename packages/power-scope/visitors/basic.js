"use strict";

const assert = require('assert');
const { getName } = require('lupa-utils');
const Scope = require('../Scope');
const _isFunctionScope = require('../helpers').isFunctionScope;

const log = console.log;
const variableDeclarationVisitor = {
    exit(node, state,c) {
        const path = state.path;

        state.scopes.pop();
        state.path.pop();
    },
    enter(node, state) {
        let scope;
        if (node.kind == 'var') {
            scope = state.functionScopes[state.functionScopes.length - 1];
        } else {
            scope = state.blockScopes[state.blockScopes.length - 1];
        }

        state.scopes.push(scope);
        state.path.push(getName(node));
    }
}


module.exports = {
    ObjectMethod: {
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
            const key = ctx.name + ctx.path.map(key => '.' + key).join('');

            state.declareVariable({
                name: key,
                loc: node.key.loc,
                scope: state.scopes[state.scopes.length - 1],
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
            const key = ctx.name + ctx.path.map(key => '.' + key).join('');

            state.declareVariable({
                name: key,
                loc: node.key.loc,
                scope: state.scopes[state.scopes.length - 1],
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
            state.analysis.scopes.push(scope);
            state.blockScopes.push(scope);
            if (isFunctionScope) {
                state.functionScopes.push(scope);
            }
        },
        exit(node, state) {
            const scope = state.blockScopes.pop();
            state.poppedScope = scope;
            if (state.parent.type == 'ForStatement') {
                //state.forScope = scope;
            }
            const parent = state.parent;

            const isFunctionScope = _isFunctionScope(node, parent);
            if (isFunctionScope) {
                state.functionScopes.pop();
            }

        }
    },
    // VariableDeclaration: {
    //     enter(node, state) {
    //
    //     },
    //     exit(node, state) {
    //
    //     }
    // },
    //VariableDeclarator: {
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
                state.analysis.refs.push([{
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
                state.analysis.refs.push([{
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
                state.analysis.refs.push(ref);
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
            state.analysis.scopes.push(scope);
            state.blockScopes.push(scope);
            state.functionScopes.push(scope);

        },
        exit(node, state) {
            node.params.forEach(param => {
                if (param.type == 'Identifier') {
                    console.log("NAZWA#", param.name,  state.functionScopes[state.functionScopes.length - 1])
                    state.declareVariable({
                        name: param.name,
                        loc: param.loc,
                        scope: state.functionScopes[state.functionScopes.length - 1],
                    });
                } else ;// throw new Error('TODO support for params other than identifiers (e.g. destructuring expressions)');

            });
            state.functionScopes.pop();
            state.blockScopes.pop();
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

            //
            // state.declareVariable({
            //     name: name + '.prop1',
            //     loc: node.id.loc,
            //     scope: state.scopes[state.scopes.length - 1],
            // });
            //
            // state.declareVariable({
            //     name: name + '.prop1.deepProp',
            //     loc: node.id.loc,
            //     scope: state.scopes[state.scopes.length - 1],
            // });

        }
    },

};
