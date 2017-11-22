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
        const analysis = state.analysis;
        services.forEachRef(state, ref_ => {
            const ref = ref_.slice();
            let baseVariable = services.resolveRef([ref[0]]);
            if (!baseVariable) {
                // declare implicit global variable
                state.declareVariable({
                    name: ref[0].key,
                    scope: analysis.scopes[0],
                    loc: {start:{column:0,line:1}, end:{line:1, column:0}},
                    isImplicit: true,
                    refs: [ref.slice()],
                });
            }
            while (ref.length) {
                const entity = services.resolveRef(ref);
                if (entity) {
                    entity.refs = entity.refs || [];
                    entity.refs.push(ref.slice());
                } else if(baseVariable) {
                    // declare implicit entry
                    baseVariable.scope.entries[services.textOf(ref)] = {
                        name: ref[ref.length - 1].name,
                        scope: baseVariable.scope,
                        loc: {start:{column:0,line:1}, end:{line:1, column:0}},
                        isImplicit: true,
                        refs: [ref.slice()],
                    };
                }
                ref.pop();
                if (ref.length && ref[ref.length - 1].key == '.') ref.pop();
            }
            //console.log("YYYYY", entity);
            //console.log("REFIK", ref.map(part=>part.key).join(''));
        });

        // set components for module.exports
        if (analysis.scopes[0]) {
            Object.keys(analysis.scopes[0].entries)
                .filter(k => k.indexOf('module.exports.') == 0)
                .map(k => analysis.scopes[0].entries[k])
                .forEach((entry) => {
                    analysis.setComponent('file', 'exports.' + entry.name, entry);
                });
        }
    }
};

module.exports = Analysis;
