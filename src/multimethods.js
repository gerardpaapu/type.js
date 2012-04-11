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
        var dispatcher = function () {
            return Generic.prototype.dispatch.call(dispatcher, arguments, this);
        };

        dispatcher.__table__     = (_table     ? slice.call(_table)     : []);
        dispatcher.__overrides__ = (_overrides ? slice.call(_overrides) : []);
        dispatcher.__default__   = _default  || function () {
            throw new NoMatchingMethodError(slice.call(arguments));
        };

        // The methods on dispatcher should all delegate to the 
        // Generic prototype so that Generic behaves as close to
        // a normal javascript constructor as possible
        // `dispatcher instanceof Generic` will still fail
        dispatcher.defineMethod = function () {
            return Generic.prototype.defineMethod.apply(this, arguments);
        };

        dispatcher.defineMethods = function () {
            return Generic.prototype.defineMethods.apply(this, arguments);
        };

        dispatcher.prefer = function () {
            return Generic.prototype.prefer.apply(this, arguments);
        };

        dispatcher.clone = function () {
            return Generic.prototype.clone.apply(this, arguments);
        };

        return dispatcher;
    };

    Generic.prototype.dispatch = function (args, ctx) {
        var i = this.__table__.length, method;

        while (i--) {
            method = this.__table__[i];

            if (method.contract.argumentsMatch(args)) {
                return method.apply(ctx, args); 
            } 
        }

        return this.__default__.apply(this, args);
    };

    Generic.prototype.defineMethod = function (argTypes, fn) {
        var contract, method, overrides;

        contract = new Signature();
        contract.argTypes = argTypes;
        contract.returnType = Type.Any;

        method = contract.wrap(fn);

        this.__table__.push(method);
        overrides = this.__overrides__;

        // Maintain order of signature specificity
        this.__table__.sort(function (a, b) {
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

    Generic.prototype.defineMethods = function () {
        var max = arguments.length - 1,
            i;

        for (i = 0; i < max; i += 2) {
            this.defineMethod.call(this, arguments[i], arguments[i + 1]);
        }
    };

    Generic.prototype.prefer = function (a, b) {
        this.__overrides__.unshift([a, b]); 
    };

    Generic.prototype.clone = function () {
        // If you want to localize a generic to a new scope/module
        // to define more methods on it.
        //
        //    var fn = module.fn.clone();
        //    fn.defineMethod(...);
        //
        return new Generic(this.__default__, this.__table__, this.__overrides__);
    };

    NoMatchingMethodError = function (args) {
        this.message = "No match for: " + [].join.call(args, ', ');
    };

    NoMatchingMethodError.prototype = new TypeError();

    Type.Generic = Generic;
    Type.NoMatchingMethodError = NoMatchingMethodError;
}());
