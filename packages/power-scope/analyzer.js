"use strict";

const estraverse = require('estraverse');

// TODO rename -> traverser? orchestrator?
const Analysis = require('./analysis');
const State = require('./state')(require('./analysisBuilder'));

//const SE = require('../san-escobar');
//const { log, spy } = SE(SE.htmlLogger);

const { isScope, isScope6 } = require('./helpers');

const getters = require('./getters');
const services = require('./services')(getters);

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
        || t == 'Identifiesr' // TODO???? Identifier?
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

function isFunction(node) {
    const t = node.type;
    return (
        t == 'FunctionDeclaration'
        || t == 'ClassMethod'
        || t == 'ObjectMethod'
        || t == 'FunctionExpression'
        || t == 'ArrowFunctionExpression'
    );
}

function enterOrLeave(phase, state) {
    const { node } = state;

    state.customEntities.length = 0;
    state.visitors.forEach((visitor) => {
        invokeVisitor(visitor, node, node.type, phase, state);
        if (isScope(node)) {
            invokeVisitor(visitor, node, 'Scope', phase, state);
        }
        if (isScope6(node)) {
            invokeVisitor(visitor, node, 'Scope6', phase, state);
        }

        if (isChainEnd(node, state)) {
            invokeVisitor(visitor, node, 'ChainEnd', phase, state);
        }
        if (isFunction(node)) {
            invokeVisitor(visitor, node, 'Function', phase, state);
        }
        state.customEntities.forEach(item => {
            invokeVisitor(visitor, item, 'CustomEntity', phase, state);
        });
        invokeVisitor(visitor, node, 'Any', phase, state);
    });
}

function Analyzer(opts = {}) {
    this.scopes = [];
    this.visitors = opts.visitors;
    this.State = opts.State || State;
    this.postprocess = 'postprocess' in opts? opts.postprocess : true;

    this.services = opts.services || services;
}


Analyzer.prototype.analyze = function analyze(ast, opts) {
    const analysis = new Analysis();

    const state = new this.State(analysis);
    state.visitors = this.visitors;

    let ids = [];
    let c = 0;
    const mainVisitor = {
        enter(node, parent) {
            // TODO test correct ids
            ids.push(state.nodeId);
            state.nodeId = ++c;
            state.prepareFromEstraverse(this, node, parent);
            enterOrLeave.call(this, 'enter', state);
        },
        leave(node, parent) {
            state.prepareFromEstraverse(this, node, parent);
            enterOrLeave.call(this, 'exit', state);
            state.nodeId = ids.pop();
        },
        fallback: 'iteration',
    };

    estraverse.traverse(ast, mainVisitor);
    if (this.postprocess) this.services.postprocess(state, Object.assign({}, getters, {
        forEachRef(state, handler) {
            state.analysis.refs.forEach(ref => {
                handler(ref);
            });
        }
    }, this.services));
    analysis.finalState = state;
    return analysis;
}


module.exports = Analyzer;
