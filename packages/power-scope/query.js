module.exports = function createInquirer(services) {
    return function query(structure) {
        return {
            data() {
                return structure;
            },
            binding() {
                return structure;
            },
            def() {
                return structure.value;
            },
            var(name) {
                return query(structure.vars[name]);
            },
            range() {
                return structure.range;
            },
            loc() {
                return structure.loc;
            },
            lookup() {
                throw new Error('not implemented');
            },
            resolve() {
                let currScope = structure[0].scope;
                const name = structure[0].key;
                let variable = services.lookupEntry(currScope, name);
                return query(variable).prop(structure.slice(2).map(k=>k.key).join(''));
                //return query(currScope).var(structure[0].key).prop(structure.slice(2).map(k=>k.key).join('.'));
            },
            prop(path) {
                return query(services.getProperty(structure, path));
            },
            refAt(pos) {
                return query(structure.refAt(pos));
            },
            text() {
                return services.textOf(structure);
            },
            scope() {
                if (Array.isArray(structure)) {
                    return query(structure[0].scope);
                }
                throw new Error('This has no scope');
            }
        };
    }
}
