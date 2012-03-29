/*globals Type: false */
// If `Type.check(value, type)` is true for any of the types.
// Type.dispatch returns the most specific type which matches
// otherwise it returns null.
//
// It will always return an instance of Type, not the shorthand
// you use e.g. `null` so that you can distinguish the results.
// 
// switch (Type.dispatch(n, Number, String, null)) {
//     case Type.Number:
//     
//     case Type.String:
//
//     case Type.Null:
//        
// }
Type.dispatch = function (value/*, type, ... */) {
    var i, len, types;

    types = [].slice.call(arguments, 1);
    len = types.length;

    for (i = 0; i < len; i++) {
        types[i] = Type.from(types[i]);
    }

    types.sort(Type.sortValue);

    for (i = 0; i < len; i++) {
        if (types[i].check(value)) {
            return types[i];
        }
    } 

    return null;
};
