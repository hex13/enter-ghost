exports.stateMixin = {
    declareVariable(entity, value) {
        //this.analysis.entities.push(Object.assign({props: value}, entity));
        console.warn("DECLARE", entity);
        const scope = entity.scope;
        scope.entries[entity.name] = Object.assign({props: value}, entity);
    },

    declareProperty(prop, value) {
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
