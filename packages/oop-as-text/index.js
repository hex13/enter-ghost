exports.serialize = function (obj) {
    return JSON.stringify(obj);
}
exports.deserialize = function (string) {
    return JSON.parse(string);
}


