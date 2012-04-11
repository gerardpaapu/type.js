/*globals Type: false */
(function (){
    var Generic,

        NoMatchingMethodError,

        // Helper functions
        matches_signature,
        signature_more_specific,

        // Comparison constants for sorting
        MORE  = 1,
        LESS  = -1,
        EQUAL = 0,

        // Local utilities
        slice  = [].slice,

        // require some types from contracts.js
        Signature = Type.Signature,
        WrappedFunction = Type.WrappedFunction;


    Generic = function (_default, _table, _overrides) {
        var dispatcher, table, overrides;

        dispatcher = function () {
            var args = slice.call(arguments),
                i    = table.length,
                method;

            while (i--) {
                method = table[i];

                if (method.contract.argumentsMatch(args)) {
                    return method.apply(this, args); 
                } 
            }

            return dispatcher.__default__.apply(this, args);
        };

        table     = dispatcher.__table__     = (_table     ? slice.call(_table)     : []);
        overrides = dispatcher.__overrides__ = (_overrides ? slice.call(_overrides) : []);
        _default  = dispatcher.__default__   = (_default   ? _default : function () { throw new NoMatchingMethodError(slice.call(arguments)); });

        dispatcher.defineMethod = function (argTypes, fn) {
            var contract, method;

            contract = new Signature();
            contract.argTypes = argTypes;
            contract.returnType = Type.Any;

            method = contract.wrap(fn);

            table.push(method);

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

                return WrappedFunction.moreSpecificThan(a, b) ? MORE : LESS;
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
            return new Generic(this.__default__, this.__table__, this.__overrides__);
        };

        return dispatcher;
    };

    NoMatchingMethodError = function (args) {
        this.message = "No match for: " + [].join.call(args, ', ');
    };

    NoMatchingMethodError.prototype = new TypeError();

    Type.Generic = Generic;
    Type.NoMatchingMethodError = NoMatchingMethodError;
}());
