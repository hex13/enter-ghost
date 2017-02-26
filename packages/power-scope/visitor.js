"use strict";

const { unknown } = require('./symbols');
const utils = require('lupa-utils');
const { getName, analyzeChain } = utils;
const assert = require('assert');
const { Entity } = require('./factories.js');

//-----------------------------------------------------------------------------
// debugging
//-----------------------------------------------------------------------------


// const SE = require('../san-escobar');
// const se = SE(SE.jsonLogger);
//

const inspect = o => console.log(require('util').inspect(o, {colors: true, depth:16}));

//-----------------------------------------------------------------------------
// helper functions
//-----------------------------------------------------------------------------

function peek(stack) {
    const curr = stack[stack.length - 1];
    return curr;
}

function pop(stack) {
    return stack.pop();
}

function push(stack, item) {
    stack.push(item);
}

function prepareExpression(state) {
    const expr = {
        value: unknown
    };
    state.expr.push(expr);
}

function evaluateExpression(state, value) {
    peek(state.expr).value = value;
}

function prepareLValue(state) {

}
function evaluateLValue(state, lvalue) {
    state.lvalue = lvalue;
}

function popExpression(state) {
    return state.expr.pop();
}

const { lookupBinding } = require('./helpers');

function setNodeInfo(state, node, name, value) {
    if (!state.shouldSetNodeInfo) {
        return;
    }
};

function islastChainLink (state, node) {

    const isLast = !(
        state.parent.type == 'MemberExpression'
        || (state.parent.type == 'CallExpression' && state.key == 'callee')
    );
    return isLast;

}

// TODO weakmaps
// TODO WeakMap
// state.nodeInfo.set(node, {scope})
// or setNodeInfo(state, node, 'scope', scope)
// or state.setNodeInfo(node, 'scope', scope)
// state.setNodeInfo(node, 'entity', something)

/**
    AST visitor for analysing JS scope. It uses few stacks for keeping track of its state.

    General overview:

    1. When visiting parent node (enter phase), items are pushed into one of the stack.
    Items are newly created JS objects with some data in it (there are item representing variables, scopes, objects etc.)
    items can have `value` property or some other properties like `vars` or `props`

    2. Then, when visiting child nodes, top items in stacks are accessed and mutated
    (for example `value` property is set).

    3. Then, during revisiting parent node (exit phase), items are popped from stacks
    and their values are taken.

    4. This is recursive so items can propagates up (from leaves to root of the tree)

    5. Remember that this is only short overwiew but exact implementation
    of this mechanism varies depends on node types.
*/
const visitor = ({
    Program: {
        exit(unused, state) {
        }
    },
    VariableDeclarator: {
        enter(unused, state) {
            prepareExpression(state);
        },
        exit({node}, state) {
            const expr = state.expr.pop();
            const name = getName(node);
            const variable = Entity({
                name,
                value: expr.value,
            }, node.id.loc);

            if (state.parent.kind == 'var') {
                peek(state.functions).vars.set(name, variable);
            } else {
                peek(state.scopes).vars.set(name, variable);
            }
        },
    },
    ObjectExpression: {
        enter(unused, state) {
            const obj = {
                props: new Map,
            };

            push(state.objects, obj);
        },
        exit(unused, state) {
            const obj = pop(state.objects);
            evaluateExpression(state, obj);
        }
    },
    ObjectProperty: {
        enter: function({node}, state) {
            prepareExpression(state);
        },
        exit({node}, state) {

            const name = getName(node);

            const expr = popExpression(state);

            const currObject = peek(state.objects);

            //currObject.props.set(name, expr.value);
            currObject && currObject.props.set(name, Entity({
                value: expr.value
            }, node.key.loc));
        },
    },
    // TODO code duplication
    ObjectMethod: {
        enter: function({node}, state) {
            prepareExpression(state);
        },
        exit({node}, state) {

            const name = getName(node);
            // TODO this is hack
            visitor.Function.enter({node}, state);
            visitor.Function.exit({node}, state);
            const expr = popExpression(state);

            const currObject = peek(state.objects);

            //currObject.props.set(name, expr.value);
            currObject && currObject.props.set(name, Entity({
                value: expr.value
            }, node.key.loc));
        },
    },

    Function: {
        enter({node}, state) {
        },
        exit({node}, state) {
            const name = getName(node);

            peek(state.scopes)
                .vars.set(name, {
                    value: state.latestScope
                });

            evaluateExpression(state, state.latestScope);
        }
    },
    Scope: {
        enter({node}, state) {

            const parentType = (state.parent && state.parent.type) || '';
            const isFunction = (
                 parentType.indexOf('Function') == 0
                 || parentType == 'ObjectMethod'

            );
            const scope = Entity({
                vars: new Map,
                type: isFunction? 'function' : node.type,
                scopes: [],
                chains: [],
                // TODO make test for `outerScope` property
                outerScope: null,
            }, node.loc);
            const currScope = peek(state.scopes);
            if (currScope) {
                scope.outerScope = currScope;
                currScope.scopes.push(scope);
            }
            push(state.scopes, scope);
            if (!state.parent || state.parent.type.indexOf('Function')==0) {
                scope.type = 'function';
                push(state.functions, scope);
            }
            push(state.result.scopes, scope);
        },
        exit({node}, state) {

            if (!state.parent || state.parent.type.indexOf('Function')==0) {
                pop(state.functions);
            }
            state.latestScope = pop(state.scopes);
        }
    },
    NumericLiteral: {
        enter({node}, state) {

        },
        exit({node}, state) {
            evaluateExpression(state, node.value);
        }
    },
    StringLiteral: {
        enter({node}, state) {

        },
        exit({node}, state) {
            evaluateExpression(state, node.value);
        }
    },
    CallExpression: {
        enter({node}, state) {
            // TODO maybe gathering arguments by stacks?
        },
        exit({node}, state) {
            //assert.equal(node.callee.type, 'Identifier', 'TODO: implement support for other callee.type than Identifier');
            const call = {
                type: 'call',
                name: node.callee.name,
                args: node.arguments.map(a => {
                    //assert.equal(a.type, 'StringLiteral', 'TODO: implement support for other argument types than StringLiteral');
                    return a.value;
                })
            };
            if (call.name == 'require') {
                state.emit('require', call.args);
            }
            evaluateExpression(state, call);
        }
    },
    Identifier: {
        enter({node}, state) {
            //prepareExpression(state);
        },
        exit({node}, state) {

            // don't analyze when on the left side of VariableDeclarator
            // this is ugly and probably not needed now because tests are passing
            // (it was temporary hack)
            // if (state.parent.type == 'VariableDeclarator' &&
            //     state.parent.id === node
            // ) {
            //     return;
            // }

            const binding = lookupBinding(peek(state.scopes), node.name);

            // TODO computed keys should be treat as chains!
//            if (state.key != 'id' && state.key != 'key' && state.key != 'property' && state.key != 'object') {
            if (state.parent.type == 'ExpressionStatement' || state.key == 'arguments' ) {
                //if (node.name == 'az')console.log("KLLUCZUZUZUZUZUZUZUZUZUZU", state.parent, node.name, node.loc.start)

                peek(state.scopes).chains.push([{
                    loc: {
                        start: node.loc.start,
                        end: node.loc.end,
                    },
                    type: 'var',
                    name: node.name
                }]);
            }
            //if (!binding) throw node.name;// console.log("!!!!!!!",node.name, state.parent.type);
            //evaluateExpression(state, binding? binding.value : unknown);

            if (state.key == 'left') {
                evaluateLValue(state, binding);
            } else {
                evaluateExpression(state, binding? binding.value : unknown);
            }
        }
    },
    AssignmentExpression: {
        enter({node}, state) {
            prepareExpression(state);
        },
        exit({node}, state) {

            const name = node.left.name;

            const binding = peek(state.scopes).vars.get(name);

            const right = popExpression(state);
            //binding.value = right.value;
            state.lvalue && (state.lvalue.value = right.value);


        }
    },
    ChainLink: {
        enter({node}, state) {
            if (node.type == 'Identifier') {
                return;
            }
            if (islastChainLink(state, node)) {
                const chain = [];
                peek(state.scopes).chains.push(chain);
                push(state.chains, chain);
            }
        },
        exit({node}, state) {

            const parent = state.parent;


            if (node.object && node.object.type == 'Identifier') {
                peek(state.chains).push({
                    name: getName(node.object),
                    loc: {
                        start: node.object.loc.start,
                        end: node.object.loc.end,
                    },
                    type: 'var',
                });
            }

            const isCallee = state.parent.type == 'CallExpression' && state.key == 'callee';
            if (node.type == 'MemberExpression') {
                peek(state.chains).push({
                    loc: {
                        start: node.property.loc.start,
                        end: node.property.loc.end
                    },
                    name: getName(node.property),
                    type: isCallee? 'call': 'prop',
                    access: isCallee? 'prop': undefined,
                });

            }
            if (node.type == 'CallExpression') {
                if (node.callee.type == 'Identifier') {
                    peek(state.chains).push({
                        loc: {
                            start: node.callee.loc.start,
                            end:  node.callee.loc.end,
                        },
                        name: getName(node.callee),
                        type: 'call',
                        access: 'var'
                    });
                }
            }
            if (islastChainLink(state, node)) {
                pop(state.chains);
            }

        }
    },
    MemberExpression: {
        enter({node}, state) {

        },
        exit({node}, state) {
            const chain = analyzeChain(node);
            let binding = lookupBinding(peek(state.scopes), chain[0].name);

            if (!binding) {
                // create binding
                binding = Entity({
                    value: {
                        props: new Map
                    }
                }, node.loc);
                // optimistically assign to global scope
                state.scopes[0].vars.set(chain[0].name, binding);
            }
            // do we still need analyze chains it this way, when we have analysis in ChainLink
            // and after we created semantic `chains`?
            let curr = binding, next;
            for (let i = 1; i < chain.length; i++) {
                if (curr.value && curr.value.props) {
                    next = curr.value.props.get(chain[i].name);
                    if (!next) {

                        // there is no such property in object, let's create it.
                        curr.value.props.set(chain[i].name, Entity({
                            value: {
                                props: new Map,
                            }
                        }, chain[i].loc));
                        next = curr.value.props.get(chain[i].name);
                    }
                    curr = next;
                }
            }
            if (state.key == 'left') {
                evaluateLValue(state, curr);
            } else {
                evaluateExpression(state, curr.value);
            }
        }
    },
    ImportDeclaration: {
        enter({node}, state) {
        },
        exit({node}, state) {
            state.emit('import', [node.source.value]);
        }
    },
    ClassDeclaration: {
        enter({node}, state) {
        },
        exit({node}, state) {
            const name = getName(node);

            peek(state.scopes).vars.set(name, {
                name,
                value: {
                    type: 'class',
                }
            });
        }
    },
    default: {
        enter({node}, state) {
        },
        exit({node}, state) {
            evaluateExpression(state, unknown)
        }
    }
});


module.exports = visitor;
