function serialize(obj) {
    return Object
        .keys(obj)
        .sort((a, b) => a < b? -1 : 1)
        .map(k => {
            let v = obj[k];
            if (v && typeof v == 'object') v = serialize(v);
            return [k, v];
        });
};

function deserialize(data) {
    const obj = {};
    data.forEach(([k, v, t]) => {
        if (Array.isArray(v)) v = deserialize(v);
        obj[k] = v;
    });
    return obj;
}

exports.serialize = serialize;
exports.deserialize = deserialize;
