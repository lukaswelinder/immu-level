import { Map, List, Set, fromJS } from 'immutable'

export function coerceToList(obj) {

  if(List.isList(obj))
    return obj;

  if(Map.isMap(obj))
    return obj.toList();

  if(Array.isArray(obj))
    return fromJS(obj);

  if(obj && typeof obj === 'object')
    return fromJS(obj).toList();

  return List();
}