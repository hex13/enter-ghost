module.exports = {
    expectValue() {
        this.expr.push({value:{}});
    },
    receiveValue() {
        return this.expr.pop().value;
    },
    passValue(obj) {
        this.last('expr').value = obj;
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
