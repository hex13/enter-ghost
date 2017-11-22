"use strict";

const { posInLoc } = require('./helpers');

const assert = require('assert');
const { lookupEntry, resolveRef, refAt, scopeAt, entryAt } = require('./services')(require('./getters'));
const { getEntries, rangeOf, textOf, refsFor } = require('./getters');
function Analysis() {
    this.scopes = [];
    this.entities = [];
    this.refs = [];
    this.componentData = Object.create(null);
}


Analysis.prototype = {
    // TODO test non -existing components
    getComponent(nodeId, componentName) {
        const componentData = this.componentData[componentName];
        if (!componentData) {
            return;
        }
        return componentData[nodeId];
    },
    setComponent(nodeId, componentName, value) {
        const data = this.componentData[componentName] || Object.create(null);
        this.componentData[componentName] = data;
        this.componentData[componentName][nodeId] = value;
    },
    getScopes() {
        return this.scopes;
    },
    scopeAt(pos) {
        return scopeAt(this.scopes, pos);
    },
    entryAt(pos) {
        return entryAt(this.scopes, pos);
    },
    entityAt(pos) {
        throw new Error('not implemented');
    },
    refAt(pos) {
        return refAt(this.refs, pos);
    },
    textOf,
    resolveRef,
    refsFor,
    rangeOf,
    getEntries,
    postprocess(state, services) {
        return services.postprocess(state, services);
    }
};

module.exports = Analysis;
