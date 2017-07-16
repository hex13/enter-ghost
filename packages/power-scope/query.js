module.exports = function Query(services) {
    return function query(structure) {
        if (!structure) {
            //throw new Error(`Query needs structure. Found ${structure}. );
        }
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
                return query(services.resolveRef(structure))
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
