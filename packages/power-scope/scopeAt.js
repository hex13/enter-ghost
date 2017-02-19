module.exports = function scopeAt(fileEntity, pos) {

    for (let i = fileEntity.scopes.length - 1; i >= 0; i--) {
        const scope = fileEntity.scopes[i];
        if (
            pos.line >= scope.loc.start.line &&
            pos.line <= scope.loc.end.line
        ) {
            if (pos.line == scope.loc.start.line) {
                if (pos.column <= scope.loc.start.column)
                    continue;
            }
            return scope;
        }
    }
}
