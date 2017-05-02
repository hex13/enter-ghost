"use strict";

const estraverse = require('estraverse');

// TODO rename -> traverser? orchestrator?
const Analysis = require('./analysis');
const State = require('./state');

const { isScope } = require('./helpers');

function invokeVisitor(visitor, node, type, phase, state) {
    if (visitor.hasOwnProperty(type)) {
        const handler = visitor[type][phase];
        if (handler) {
            handler(node, state);
        }
    }
}

function isChainLink(node, state) {
    const t = node.type;

    return (
        t == 'MemberExpression'
        || t == 'CallExpression'
        || t == 'Identifiesr'
    );
}

function isChainEnd(node, state) {
    const parentType = state.parent && state.parent.type;
    if (!parentType) return false;
    return isChainLink(node, state) && (
        !isChainLink(state.parent, state)
        || state.key == 'arguments'
    );
}

function enterOrLeave(phase, state) {
    const { node } = state;

    state.visitors.forEach((visitor) => {
        invokeVisitor(visitor, node, node.type, phase, state);
        if (isScope(node)) {
            invokeVisitor(visitor, node, 'Scope', phase, state);
        }
        if (isChainEnd(node, state)) {
            console.log("CHAIN END")
            invokeVisitor(visitor, node, 'ChainEnd', phase, state);
        }
    });
}

function Analyzer(opts = {}) {
    this.scopes = [];
    this.visitors = opts.visitors;
}


Analyzer.prototype.analyze = function analyze(ast, opts) {
    const analysis = new Analysis();

    const state = new State(analysis);
    state.visitors = this.visitors;

    const mainVisitor = {
        enter(node, parent) {
            state.prepareFromEstraverse(this, node, parent);
            enterOrLeave.call(this, 'enter', state);
        },
        leave(node, parent) {
            state.prepareFromEstraverse(this, node, parent);
            enterOrLeave.call(this, 'exit', state);
        },
        fallback: 'iteration',
    };

    estraverse.traverse(ast, mainVisitor);

    analysis.postprocess();
    return analysis;
}


module.exports = Analyzer;
