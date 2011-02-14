var Generic = (function (){
    var Generic,

        // Helper functions
        inUnion,
        matches_signature,
        type_more_specific,
        signature_more_specific,

        // Comparison constants for sorting
        MORE  = 1,
        LESS  = -1,
        EQUAL = 0,

        // Import all the classes from Type
        Null        = Type.Null,
        NAN         = Type.NAN,
        NativeClass = Type.NativeClass,
        Class       = Type.Class,
        Union       = Type.Union,
        Predicate   = Type.Predicate,
        Duck        = Type.Duck,

        // Local utilities
        hasOwn = {}.hasOwnProperty,
        slice  = [].slice,
        undef;

    Generic = function (_table, _overrides) {
        var dispatcher, table, overrides;

        dispatcher = function () {
            var args = slice.call(arguments),
                len  = table.length,
                i;

            for (i = 0; i < len; i++) {
                method = table[i];

                if (matches_signature(args, method.signature)) {
                    return method.fn.apply(this, args); 
                } 
            }

            throw Error("No Signature Matched: " + args.toString());
        };

        table     = dispatcher.__table__     = _table     ? slice.call(_table)     : [];
        overrides = dispatcher.__overrides__ = _overrides ? slice.call(_overrides) : [];

        dispatcher.defineMethod = function (sig, fn) {
            // push the method to the front
            table.unshift({ signature: sig, fn: fn });

            // Maintain order of signature specificity
            table.sort(function (a, b) {
                var index_a = overrides.indexOf(a),
                    index_b = overrides.indexOf(b);

                if (index_a == -1 || index_b == -1) {
                    return signature_more_specific(a.signature, b.signature);
                }

                return index_a < index_b ? MORE : LESS;
            });
        };

        dispatcher.clone = function () {
            // If you want to localize a generic to a new scope/module
            // to define more methods on it.
            //
            //    var fn = module.fn.clone();
            //    fn.defineMethod(...);
            //
            return new Generic(this.__table__, this.__overrides__);
        };

        return dispatcher;
    };

    matches_signature = function (args, signature) {
	var length = signature.length, i;        

	for (i = 0; i < length; i++) {
	    if (!Type.check(args[i], signature[i])) {
		return false;
	    }    
	}	

	return true;
    };

    signature_more_specific = function (a, b) {
        var len = a.length,
            max = b.length,
	    i;

        for (i = 0; i < len; i++) {
            if (i >= max || type_more_specific(a[i], b[i])) {
                return true;
            }
        }

        return false;
    };

    type_more_specific = function (a, b) {
        a = Type.from(a);
        b = Type.from(b);

        if (a === b) { return EQUAL; }

        // `Null` is the most specific type
        if (b === Null) { return LESS; }  
        if (a === Null) { return MORE; }

        // `NAN` has to be more specific than `Number`
        if (b === NAN) { return LESS; }  
        if (a === NAN) { return MORE; }
        
        
        // `Union` types are less specific than all their members
        if (inUnion(a, b)) { return MORE; }
        if (inUnion(b, a)) { return LESS; }

        // If `a` and `b` are Classes and `a` inherits from `b` 
        // then `a` is more specific
        if (a instanceof Class && b instanceof Class) {
            return a.inheritsFrom(b) ? MORE
                :  b.inheritsFrom(a) ? LESS
                :                      EQUAL; 
        }

        // `Predicate` is the least specific type
        if (a instanceof Predicate) { 
            return (b instanceof Predicate) ? EQUAL : LESS; 
        } 

        if (b instanceof Predicate) { return MORE; }

        return EQUAL;
    }; 

    inUnion = function (type, union) {
        return union instanceof Union && union.contains(type);
    };

    return Generic;
}());