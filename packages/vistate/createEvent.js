module.exports = function createEvent(model, type, args) {
    return {target: model.$localId(), type, args};
}
