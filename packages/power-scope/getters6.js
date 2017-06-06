function getEntries(scope) {
    return scope? scope.entries : [];
}

function rangeOf(item) {
    return item.loc;
}

function textOf(item) {
    if (item[0] && item[0].isChain) {
        return item.map(part => part.key).join('');
    }
}

function refsFor(def) {
    return def.refs;
}

function getEntry(scope, name) {
    return scope? scope.vars[name] : undefined;
}

module.exports = {
    getEntries, rangeOf, textOf, refsFor, getEntry
};
