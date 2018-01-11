module.exports = function copyDeep(value) {
    if (Array.isArray(value)) {
        return value.map(copyDeep);
    }
    if (value && typeof value == 'object') {
        const copy = {};
        for (let k in value) {
            copy[k] = copyDeep(value[k]);
        }
        return copy;
    }
    return value;
}
