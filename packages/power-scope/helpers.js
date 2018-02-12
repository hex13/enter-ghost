function _isScope (node) {
    return (
        node.type.indexOf('Program') == 0
        //node.type.indexOf('Function') == 0 ||
        || node.type.indexOf('BlockStatement') == 0
        || node.type == 'ForStatement'
    );
};

function isScope (node) {
    return (
        node.type == 'Program'
        //node.type.indexOf('Function') == 0 ||
        || node.type == 'BlockStatement'
        || node.type == 'ForStatement'
    );
};

function isScope6 (node) {
    return (
        node.type == 'Program'
        //node.type.indexOf('Function') == 0 ||
        || node.type == 'BlockStatement'
        || node.type == 'ForStatement'
        || node.type == 'FunctionDeclaration'
        || node.type == 'FunctionExpression'
        //|| node.type == 'ObjectMethod' // !! TODO
    );
};

function isScopeAutumn (node) {
    return (
        node.type == 'Program'
        //node.type.indexOf('Function') == 0 ||
        || node.type == 'BlockStatement'
        || node.type == 'ClassMethod'
        || node.type == 'ObjectMethod'
        || node.type == 'ForStatement'
        || node.type == 'FunctionDeclaration'
        || node.type == 'FunctionExpression'
        || node.type == 'ArrowFunctionExpression'        
        //|| node.type == 'ObjectMethod' // !! TODO
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
        || parent.type == 'ObjectMethod'
        || parent.type.includes('Function')
    );
}

function isFunctionScope6(node, parent) {
    return (
        node.type == 'Program'
        || parent.type == 'ClassMethod'
        || parent.type == 'ObjectMethod'
        || parent.type.includes('Function')
    );
}


exports.isScope = isScope;
exports.isScope6 = isScope6;
exports.isScopeAutumn = isScopeAutumn;
exports.posInLoc = posInLoc;
exports.isFunctionScope = isFunctionScope;
exports.isFunctionScope6 = isFunctionScope6;

