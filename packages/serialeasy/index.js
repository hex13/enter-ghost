'use strict';

function serialize(obj, preset = {}) {
    const values = preset.values || {};
    const valueMap = new Map(
        Object.keys(values).map(k => [values[k],k])
    );

    const _serialize = (obj) => {
        const val = valueMap.get(obj);

        if (val !== undefined) {
            return ['val', val];
        }
        if (Array.isArray(obj)) {
            return ["arr", obj.map(serialize)]
        }
        if (obj && typeof obj == 'object') {
            return Object
                .keys(obj)
                .sort((a, b) => a < b? -1 : 1)
                .map(k => [k, _serialize(obj[k])]);
        }
        return obj;
    }

    return _serialize(obj);
};

function deserialize(data) {
    if (!Array.isArray(data)) return data;

    if (Object.prototype.toString.call(data[0]) == '[object String]') {
        const t = data[0];
        if (t == 'arr') return data[1].map(deserialize);
        // if (t == 'val') {
        //
        // }
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
