import { Map, List, Set, fromJS } from 'immutable'

export function coerceToList(obj) {
  if(!obj) return List();

  switch(obj.constructor.name) {
    case 'List':
      return obj;
    case 'Array':
      return fromJS(obj);
    case 'Map':
      return obj.toList();
    case 'Object':
      return fromJS(obj).toList();
    default:
      return List();
  }

}