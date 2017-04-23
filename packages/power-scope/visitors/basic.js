"use strict";

const assert = require('assert');
const { getName } = require('lupa-utils');

const variableDeclarationVisitor = {
    exit(node, state,c) {
        //assert(state.parent.type, 'VariableDeclaration');
        if (state.parent.type == 'ForStatement') {
            return;
        }

        const kind = node.kind;


        node.declarations.forEach(node => {
            if (node.id.type != 'Identifier') {
                //assert.equal(node.id.type, 'Identifier', 'TODO support for other types of id than identifier')
                console.warn('TODO support for other types of id than identifier');
                return;
            }

            const name = getName(node);

            let scope;
            if (kind == 'var') {
                scope = state.functionScopes[state.functionScopes.length - 1];
            } else {
                scope = state.blockScopes[state.blockScopes.length - 1];
            }


            state.declareVariable({
                name,
                loc: node.id.loc,
                scope,
                kind,
            }, state.expr.pop());

            //state.analysis.entities.push();
        });
    },
    enter(node, state) {

    }
}


module.exports = {
    ObjectProperty: {
        enter(node, state) {

        },
        exit(node, state) {
            state.declareProperty({
                name: node.key.name,
                loc: node.key.loc,
            }, state.expr.pop());
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
        },
        exit(node, state) {
            state.exitObject();
        }
    },
    Scope: {
        enter(node, state) {
            const parent = state.parent;
            const isFunctionScope = (
                node.type == 'Program'
                || parent.type == 'ClassMethod'
                || parent.type.includes('Function')
            );
            const scope = {
                loc: node.loc,
                isFunctionScope,
                parent: state.blockScopes[state.blockScopes.length - 1],
            };
            state.analysis.scopes.push(scope);
            state.blockScopes.push(scope);
            if (isFunctionScope) {
                state.functionScopes.push(scope);
            }
        },
        exit(node, state) {
            const scope = state.blockScopes.pop();
            if (state.parent.type == 'ForStatement') {
                //state.forScope = scope;
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
                    key: getName(node),
                    loc: node.loc,
                    scope: state.blockScopes[state.blockScopes.length - 1]
                }]);
            }
        }
    },
    CallExpression: {
        enter(node, state) {
        },
        exit(node, state) {
            state.chains[state.chains.length - 1].push({
                key: '()'
            });
        }
    },
    ChainEnd: {
        enter(node, state) {
            state.chains.push([]);
        },
        exit(node, state) {
            const ref = state.chains.pop();
            state.analysis.refs.push(ref);
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
    VariableDeclaration: variableDeclarationVisitor,
};
