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
            prop(path) {
                const parts = path.split('.');
                let curr = structure;
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
            }
        };
    }
}
