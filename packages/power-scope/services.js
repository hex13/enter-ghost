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

    return {
        lookupEntry, resolveRef, refAt, scopeAt, entryAt
    };
};
