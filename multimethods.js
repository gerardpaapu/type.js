(function (){
    var Generic,

        NoMatchingMethodError,

        // Helper functions
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
                i  = table.length;

            while (i--) {
                method = table[i];

                if (matches_signature(args, method.signature)) {
                    return method.fn.apply(this, args); 
                } 
            }

            throw new NoMatchingMethodError(args);
        };

        table     = dispatcher.__table__     = (_table     ? slice.call(_table)     : []);
        overrides = dispatcher.__overrides__ = (_overrides ? slice.call(_overrides) : []);

        dispatcher.defineMethod = function (sig, fn) {
            table.push({ signature: sig, fn: fn });

            // Maintain order of signature specificity
            table.sort(function (a, b) {
                var index_a, index_b, max, i;

                for (i = 0, max = overrides.length; i < max; i++) {
                    index_a = overrides[i].indexOf(a);
                    index_b = overrides[i].indexOf(b);

                    if (index_a != -1 && index_b != -1) {
                        return index_a < index_b ? MORE : LESS;
                    }
                }

                return signature_more_specific(a.signature, b.signature);
            });
        };

        dispatcher.defineMethods = function () {
            var max = arguments.length - 1,
                i;

            for (i = 0; i < max; i += 2) {
                this.defineMethod.call(this, arguments[i], arguments[i + 1]);
            }
        };

        dispatcher.prefer = function (a, b) {
            overrides.unshift([a, b]); 
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

    NoMatchingMethodError = function (args) {
        this.message = "No match for: " + [].join.call(args, ', ');
    };

    NoMatchingMethodError.prototype = new TypeError();

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
            if (i >= max || Type.moreSpecificThan(a[i], b[i])) {
                return true;
            }
        }

        return false;
    };

    Type.Generic = Generic;
    Type.NoMatchingMethodError = NoMatchingMethodError;
}());
