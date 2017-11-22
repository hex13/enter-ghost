const { posInLoc } = require('./helpers');

module.exports = (getters) => {
    const { getEntries, getEntry } = getters;
    function lookupEntry(scope, name) {
        let entity;
        do {
            entity = getEntry(scope, name);
            scope = scope.parent;
        } while(!entity && scope);
        return entity;
    }

    function resolveRef(ref) {
        let name = ref[0].key;

        let initialScope = ref[0].scope;
        if (name == 'this') {
            name = initialScope.thisPath;
            initialScope = ref[0].scope.thisScope;//.parent;
        }

        let entries;
        if (!initialScope) return;

        const entity = lookupEntry(initialScope, name)

        if (!entity) {
            return;
        }

        const scope = entity.scope;

        entries = getEntries(scope);
        return entries[name + ref.slice(1).map(k=>k.key).join('')] ;
    }

    function refAt(refs, pos) {
        if (refs.refs) refs = refs.refs;
        for (let ri = 0; ri < refs.length; ri++) {
            const item = refs[ri];

            if(!item[0].loc) continue;
            for (let i = 0; i < item.length; i++) {
                const loc = item[i].loc;
                if (loc && posInLoc(pos, loc)) {
                    return item.slice(0, i + 1);
                }
            }
        }
    }

    function scopeAt(scopes, pos) {
        let i = scopes.length;
        while (i--) {
            const scope = scopes[i];
            if (posInLoc(pos, scope.loc))
                return scope;
        }
    }
    // TODO support for hoisting / lookup in parent scopes (is this comment still relevant?)

    function entryAt(scopes, pos) {
        let scope = scopeAt(scopes, pos);
        if (!scope)
            return;
        let entity;
        do {
            let entries = getEntries(scope);
            entity = Object.keys(entries)
                .map(key => entries[key])
                .find(entry => {
                    return posInLoc(pos, entry.loc)
                });
            scope = scope.parent;
        } while(!entity && scope);
        return entity;
    }


    function postprocess(state, services) {

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

    return {
        lookupEntry, resolveRef, refAt, scopeAt, entryAt, postprocess
    };
};
