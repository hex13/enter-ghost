'use strict';

exports.get = function get(target, path) {
  if (typeof path == 'function') return path(target);
  if (typeof path == 'string' || path instanceof String) {
    return target[path];
  }
  if (!path || !path.length) return target;
  let curr = target, i;
  for (i = 0; curr && i < path.length - 1; curr = curr[path[i++]]) ;
  if (curr) return curr[path[i]];
}
exports.set = function set(target, path, value) {
  let curr = target, i;
  if (typeof path == 'string' || path instanceof String) {
    target[path] = value;
    return;
  }
  for (i = 0; i < path.length - 1; i++) {
      curr = curr[path[i]] || (curr[path[i]] = {});
  };
  curr[path[i]] = value
}
