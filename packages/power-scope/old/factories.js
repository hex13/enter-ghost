
exports.Entity = function (self, loc) {
    if (!loc) loc = {
        start: {line: 0, column: 0},
        end: {line: 0, column: 0},
    }
    return Object.assign(self, {
        prop(name) {
            return this.value.props.get(name);
        },
        var(name) {
            const vars = this.vars || this.value.vars;
            return vars.get(name);
        },
        loc: {
            start: loc.start,
            end: loc.end
        },
    });
};
