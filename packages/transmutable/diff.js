const { MUTATION } = require('./symbols');


module.exports = function diff(a, b) {
    if (
        a && typeof a == 'object'
        && b && typeof b == 'object'
    ) {

        if (Array.isArray(a) && Array.isArray(b)) {
            const areSame = a.length == b.length && a.every((item, i) => {
                return diff(item, b[i]) === undefined;
            });

            if (!areSame) {
                return {
                    [MUTATION]: {
                        value: b
                    }
                }
            }
        }
        const keys = Object.keys(b).concat(Object.keys(a));
        const patch = {};
        keys.forEach(k => {

            const deeperPatch = diff(a[k], b[k]);
            if (deeperPatch)
                patch[k] = deeperPatch;
        });

        return Object.keys(patch).length? patch : undefined;
    }
    if (a !== b) {
        return {
            [MUTATION]: {
                value: b
            }
        }
    }
}
