import { Map, List, Set, fromJS } from 'immutable'

export function coerceToMap(obj) {
  if(!obj) return Map();

  switch(obj.constructor.name) {
    case 'List':
      return obj.toMap();
    case 'Array':
      return Map(obj.map((val, i) => [Number(i), val]));
    case 'Object':
      return fromJS(obj);
    default:
      return Map();
  }

}

export function mapKeyPaths(keyPath, obj, cb, ret, method) {

  if(typeof obj === 'function')
    cb = obj, obj = keyPath, keyPath = List();

  if(!ret)
    ret = List();

  if(!List.isList(keyPath))
    keyPath = coerceToList(keyPath);

  if(!Map.isMap(obj))
    obj = coerceToMap(obj);

  return obj[method]((curr, val, key) => {

    if(val && typeof val === 'object')
      return mapKeyPaths(keyPath.push(key), val, cb, curr, method);

    if(typeof cb === 'function')
      return cb(curr, val, keyPath.push(key).toArray());

    return curr.push({ key: keyPath.push(key).toArray(), value: val })

  }, ret);

}