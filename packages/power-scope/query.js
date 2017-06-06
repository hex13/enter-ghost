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
            resolve() {
                // TODO
                    // structure[0].scope.
                    // this.lookup(structure[0].scope, textof)
                let currScope = structure[0].scope;
                const name = structure[0].key;
                let variable = services.lookupEntry(currScope, name);
                // find scope for variable
                // do {
                //     variable = query(currScope).var(structure[0].key).data();
                //     currScope = currScope.parent;
                // } while (currScope && !variable);
                return query(variable).prop(structure.slice(2).map(k=>k.key).join('.'));
                //return query(currScope).var(structure[0].key).prop(structure.slice(2).map(k=>k.key).join('.'));
            },
            prop(path) {
                const parts = path.split('.');
                let curr = structure.value || structure;
                do {
                    const propName = parts.shift();
                    if (!Object.hasOwnProperty.call(curr.props, propName)) {
                        throw new Error(`Property ${propName} doesn't exist.`);
                    }
                    curr = curr.props[propName];
                } while (parts.length);
                return query(curr);
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
