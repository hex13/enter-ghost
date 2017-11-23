"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function set(target, path, value) {
    var curr = target,
        i = void 0;
    for (i = 0; i < path.length - 1; curr = curr[path[i++]]) {}
    curr[path[i]] = value;
}

function get(target, path) {
    var curr = target,
        i = void 0;
    for (i = 0; curr && i < path.length - 1; curr = curr[path[i++]]) {}
    if (curr) return curr[path[i]];
}

function isDirty(mutations, propPath, target) {
    for (var i = 0; i < mutations.length; i++) {
        var mutPath = mutations[i][0];
        var mutValue = mutations[i][1];
        var minLen = Math.min(mutPath.length, propPath.length);
        var affectedByMutation = true;
        for (var j = 0; j < minLen; j++) {
            var mutPropName = mutPath[j];
            var searchedPropName = propPath[j];
            if (mutPropName !== searchedPropName) {
                affectedByMutation = false;
                break;
            }
        }
        if (affectedByMutation) {
            if (get(target, mutPath) !== mutValue) return true;
        }
    }
    return false;
}

function cloneDeepWithDirtyChecking(o, mutations) {

    var copy = function copy(o) {
        var objPath = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

        if (!isDirty(mutations, objPath, o)) return o;
        var o2 = void 0;
        if (Array.isArray(o)) {
            o2 = o.slice();
        } else o2 = {};

        // NOTE currently we're doing for...in also for arrays (is this correct?)

        for (var k in o) {
            if (o[k] && _typeof(o[k]) == 'object') {
                var propPath = new Array(objPath.length + 1);
                for (var i = 0; i < objPath.length; i++) {
                    propPath[i] = objPath[i];
                }
                propPath[objPath.length] = k;

                o2[k] = copy(o[k], propPath);
            } else {
                o2[k] = o[k];
            }
        }
        return o2;
    };
    return copy(o);
}

function Transmutable(o) {
    var _this = this;

    this.mutations = [];
    this.target = o;

    var createStage = function createStage(o) {
        var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

        var getTarget = function getTarget() {
            return typeof o == 'function' ? o() : o;
        };
        var proxy = new Proxy(getTarget(), {
            get: function get(nonUsedProxyTarget, name) {
                // transmutable.target can change
                // so we want to have always the current target
                var target = getTarget();

                if (target[name] && _typeof(target[name]) == 'object') {
                    return createStage(target[name], path.concat(name));
                }
                return target[name];
            },
            set: function set(nonUsedProxyTarget, k, v) {
                var mutPath = [];
                for (var i = 0; i < path.length + 1; i++) {
                    mutPath.push(path[i] || k);
                }
                _this.mutations.push([mutPath, v]);
                return true;
            }
        });
        return proxy;
    };

    this.stage = createStage(function () {
        return _this.target;
    });
}

Transmutable.prototype.pushTo = function pushTo(target) {
    var proposed = this;
    for (var i = 0; i < proposed.mutations.length; i++) {
        var m = proposed.mutations[i];;
        if (!m) break;

        var _m = _slicedToArray(m, 2),
            path = _m[0],
            value = _m[1];

        set(target, path, value);
    }
};

Transmutable.prototype.commit = function commit() {
    var copied = this.reify();
    this.target = copied;
    this.mutations.length = 0;
    return copied;
};

Transmutable.prototype.reify = function reify(target) {
    var copied = cloneDeepWithDirtyChecking(this.target, this.mutations);
    this.pushTo(copied);
    return copied;
};

exports.Transmutable = Transmutable;

exports.transform = function (original, transformer) {
    var t = new Transmutable(original);
    transformer(t.stage);
    return t.reify();
};

//exports.clone = cloneDeepWithDirtyChecking;
