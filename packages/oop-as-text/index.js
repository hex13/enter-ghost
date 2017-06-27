const classes = Object.create(null);

exports.register = function (name, constructor) {
    classes[name] = constructor;
}
exports.serialize = function (obj) {
    return JSON.stringify(obj);
}

function reviver(key, value) {
    if (value.type) {
        return new classes[value.type](value);
    }
    return value;
};

exports.deserialize = function (string) {

    return JSON.parse(string, reviver);
}
