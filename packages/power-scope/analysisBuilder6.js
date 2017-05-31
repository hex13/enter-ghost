module.exports = {
    expectValue() {
        this.expr.push({value:{}});
    },
    expectValues() {
        this.expr.push({values:[]});
    },
    receiveValue() {
        return this.expr.pop().value;
    },
    receiveValues() {
        return this.expr.pop().values;
    },
    passValue(obj) {
        const expr = this.last('expr');
        if (expr.values) {
            expr.values.push(obj);
        } else {
            expr.value = obj;
        }
    },
    assignThis(meth, obj) {
        this.thisMap.set(meth, obj);
    },
    // setProperty(obj, name, value) {
    //     obj.props[name] = value;
    // },
    bindProperty(obj, binding) {
        obj.props[binding.name] = binding;
    }
}
