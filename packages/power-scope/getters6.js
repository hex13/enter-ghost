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

function getProperty(obj, path) {
    const parts = path.split('.');
    let curr = obj.value || obj;
    do {
        const propName = parts.shift();
        if (!Object.hasOwnProperty.call(curr.props, propName)) {
            throw new Error(`Property ${propName} doesn't exist.`);
        }
        curr = curr.props[propName];
    } while (parts.length);
    return curr;
}

// TODO consider using Flow or TypeScript in this file to ensure contract.
module.exports = {
    getEntries, rangeOf, textOf, refsFor, getEntry, getProperty
};
