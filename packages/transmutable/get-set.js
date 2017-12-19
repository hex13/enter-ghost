'use strict';

exports.get = function get(target, path) {
  let curr = target, i;
  for (i = 0; curr && i < path.length - 1; curr = curr[path[i++]]) ;
  if (curr) return curr[path[i]];
}
exports.set = function set(target, path, value) {
  let curr = target, i;
  for (i = 0; i < path.length - 1; curr = curr[path[i++]]) ;
  curr[path[i]] = value
}
