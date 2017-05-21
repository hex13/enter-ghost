"use strict";

const { posInLoc } = require('./helpers');

const assert = require('assert');
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
    commentsFor() {

    },
    getEntries(scope) {
        return scope? scope.entries : [];
    },
    getScopes() {
        return this.scopes;
    },
    scopeAt(pos) {
        let i = this.scopes.length;
        while (i--) {
            const scope = this.scopes[i];
            if (posInLoc(pos, scope.loc))
                return scope;
        }
    },
    // TODO support for hoisting / lookup in parent scopes
    entryAt(pos) {
        let scope = this.scopeAt(pos);
        let entity;
        do {
            let entries = this.getEntries(scope);
            entity = Object.keys(entries)
                .map(key => entries[key])
                .find(entry => {
                    return posInLoc(pos, entry.loc)
                });
            scope = scope.parent;
        } while(!entity && scope);
        return entity;
    },
    entityAt(pos) {
        throw new Error('not implemented');
    },
    rangeOf(item) {
        return item.loc;
    },
    refAt(pos) {
        for (let ri = 0; ri < this.refs.length; ri++) {
            const item = this.refs[ri];

            if(!item[0].loc) continue;
            for (let i = 0; i < item.length; i++) {
                const loc = item[i].loc;
                if (loc && posInLoc(pos, loc)) {
                    return item.slice(0, i + 1);
                }
            }
        }
        // return this.refs.find(item => {
        // });
    },
    // TODO rename -> findDef
    textOf(item) {
        if (item[0] && item[0].isChain) {
            return item.map(part => part.key).join('');
        }
    },
    getEntry(scope, name) {
        return scope.entries[name];
    },
    lookupEntry(scope, name) {
        let entity;
        do {
            entity = this.getEntry(scope, name);
            scope = scope.parent;
        } while(!entity && scope);
        return entity;
    },
    resolveRef(ref) {
        let name = ref[0].key;

        let initialScope = ref[0].scope;
        if (name == 'this') {
            name = initialScope.thisPath;
            initialScope = ref[0].scope.thisScope;//.parent;
        }

        let entries;
        if (!initialScope) return;

        const entity = this.lookupEntry(initialScope, name)

        if (!entity) {
            return;
        }

        const scope = entity.scope;
        entries = this.getEntries(scope);

        if (ref.length > 1) {
            let op = '';
            let curr = entity;
            let path = name;
            for (let i = 1; i < ref.length; i++) {
                if (ref[i].key == '.') {
                    op = 'prop';
                } else {
                    if (op == 'prop' && curr) {
                        path = path + '.' + ref[i].key;
                        curr = entries[path];
                    } else {
                        return;  // TODO test this.
                    }
                    if (!curr)  {
                        return // TODO test this.
                        //console.log("!!!!!ZN", ref.map(p=>p.key).join(''))
                    }

                }
            }
            return curr;
        }
        return entity;
    },
    refsFor(def) {
        return def.refs; // TODO test this.
    },
    postprocess() {
        this.refs.forEach(ref_ => {
            const ref = ref_.slice();
            const baseVariable = this.resolveRef([ref[0]]);
            while (ref.length) {
                const entity = this.resolveRef(ref);
                if (entity) {
                    entity.refs = entity.refs || [];
                    entity.refs.push(ref.slice());
                } else if(baseVariable) {
                    // declare implicit entry
                    baseVariable.scope.entries[this.textOf(ref)] = {
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
    }
};

module.exports = Analysis;
