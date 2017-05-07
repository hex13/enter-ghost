exports.stateMixin = {
    declareVariable(entity, value, key) {
        //this.analysis.entities.push(Object.assign({props: value}, entity));
        //console.warn("DECLARE", entity);
        const scope = entity.scope;
        if (!scope) console.error("NO SCOPE", entity, new Error)
        scope.entries[key || entity.name] = Object.assign({props: value}, entity);
    },

    declareParamsFrom(node) {
        const state = this;
        node.params.forEach(param => {
            if (param.type == 'Identifier') {
                console.error("DECKPARAM", state.blockScopes.length)
                state.declareVariable({
                    name: param.name,
                    loc: param.loc,
                    scope: state.functionScopes[state.functionScopes.length - 1],
                });
            } else ;// throw new Error('TODO support for params other than identifiers (e.g. destructuring expressions)');

        });
    },

    declareProperty(ctx, prop) {
        const key = ctx.name + ctx.path.map(key => '.' + key).join('');
        this.declareVariable(prop, null, key);
    },

    enterObject() {

    },
    exitObject() {
    },
}


// exports.stateMixin = {
//     declareVariable(entity, value) {
//         this.analysis.entities.push(Object.assign({props: value}, entity));
//     },
//
//     declareProperty(prop, value) {
//         this.props[this.props.length - 1].push(Object.assign({props: value}, prop));
//     },
//
//     enterObject() {
//         this.props.push([]);
//     },
//     exitObject() {
//         const props = this.props.pop();
//         this.expr.push(props);
//     },
// }
//
// exports.analysisUtil = {
//     getProperty(obj, name) {
//         return obj.props.find(prop => prop.name == name);
//     },
//     hasProps(obj) {
//         return obj.props;
//     }
// }
