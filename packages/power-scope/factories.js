
exports.Entity = function (self, loc) {
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
