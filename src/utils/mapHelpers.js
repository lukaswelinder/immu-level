import { Map, List, Set, fromJS } from 'immutable'


export function coerceToMap(obj) {

  if(List.isList(obj))
    return obj.toMap();

  if(Array.isArray(obj))
    return Map(obj.map((val, i) => [Number(i), val]));

  if(typeof obj === 'object')
    return fromJS(obj);

  return Map();

}