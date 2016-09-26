import { Map, List, Set, fromJS } from 'immutable'


export function coerceToMap(obj) {

  if(List.isList(obj))
    return obj.toMap();

  if(Array.isArray(obj))
    return Map(obj.map((val, i) => [Number(i), val]));

  if(typeof obj === 'object')
    return fromJS(obj);

}

export function mapKeyPaths(root, obj, ret) {

  if(!obj)
    obj = root, root = [];

  if(!ret)
    ret = Map();

  if(!List.isList(root))
    root = List(root);

  if(!Map.isMap(obj))
    obj = coerceToMap(obj);

  return obj.reduce((curr, val, key) => {

    if(typeof val === 'object')
      return mapKeyPaths(root.push(key), val, curr);

    return curr.set(root.push(key), val);

  }, ret);

}