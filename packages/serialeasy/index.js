function serialize(obj) {
    if (Array.isArray(obj)) {
        return ["arr", obj.map(serialize)]
    }
    if (obj && typeof obj == 'object') {
        return Object
            .keys(obj)
            .sort((a, b) => a < b? -1 : 1)
            .map(k => [k, serialize(obj[k])]);
    }
    return obj;
};

function deserialize(data) {
    if (!Array.isArray(data)) return data;

    if (Object.prototype.toString.call(data[0]) == '[object String]') {
        return data[1].map(deserialize);
    }

    if (data && typeof data == 'object') {
        const obj = {};
        data.forEach(([k, v, t]) => {
            if (Array.isArray(v)) v = deserialize(v);
            obj[k] = v;
        });
        return obj;
    }

}

exports.serialize = serialize;
exports.deserialize = deserialize;
