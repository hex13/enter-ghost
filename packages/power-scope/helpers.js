function isScope (node) {
    return (
        node.type.indexOf('Program') == 0
        //node.type.indexOf('Function') == 0 ||
        || node.type.indexOf('BlockStatement') == 0
        || node.type == 'ForStatement'
    );
};

function posInLoc(pos, loc) {
    return (
        (pos.line != loc.start.line || pos.column >= loc.start.column)
        && (pos.line != loc.end.line || pos.column <= loc.end.column)
        && pos.line >= loc.start.line && pos.line <= loc.end.line
    );
}

function isFunctionScope(node, parent) {
    return (
        node.type == 'Program'
        || parent.type == 'ClassMethod'
        || parent.type.includes('Function')
    );
}

exports.isScope = isScope;
exports.posInLoc = posInLoc;
exports.isFunctionScope = isFunctionScope;
