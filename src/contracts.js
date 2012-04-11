/*globals Type: false */
/*jshint eqnull: true */
(function (){
    var Module, Signature,
        CallerBrokeContractError,
        ProviderBrokeContractError,
        slice  = [].slice,
        hasOwn = {}.hasOwnProperty;

    Module = Type.Module = function (fn) {
        fn.call(this);
    };

    CallerBrokeContractError = function () {};
    CallerBrokeContractError.prototype = new TypeError();
    CallerBrokeContractError.prototype.name =
    CallerBrokeContractError.prototype.message = "Caller Broke Contract";
    
    ProviderBrokeContractError = function () {};
    ProviderBrokeContractError.prototype = new TypeError();
    ProviderBrokeContractError.prototype.name = 
    ProviderBrokeContractError.prototype.message = "Provider Broke Contract";

    Module.prototype.provide = function (name, value, contract) {
        if (hasOwn.call(this, name)) { 
            throw new Error("'" + name + "' already defined");
        }

        if (arguments.length < 3) {
            // no contract provided
            this[name] = value;

        } else if (Type.check(contract, Signature)) {
            this[name] = contract.wrap(value); 

        } else if (Type.check(contract, Array)) {
            this[name] = Signature.from(contract).wrap(value);

        } else {
            if (!Type.check(value, contract)) {
                throw new ProviderBrokeContractError(value, contract);
            }

            this[name] = value;
        }
    };

    Module.prototype.provides = function (obj) {
        var key, value, args;

        for (key in obj) {
            if (hasOwn.call(obj, key)) {
                args = [key].concat(value);
                this.provide.apply(this, args);
            }
        }
    };

    Signature = Type.Signature = function (/* argTypes..., returnType */) {
        var args = arguments,
            i    = args.length - 1;

        this.argTypes = slice.call(args, i);
        this.returnType = args[i];
    };

    Signature.from = function (arr) {
        if (arr instanceof Signature) return arr;

        var i    = arr.length - 1,
            sig  = new Signature();

        sig.argTypes = slice.call(arr, 0, i);
        sig.returnType = arr[i];

        return sig;
    };

    Signature.prototype.callWithContract = function (fn, ctx) {
        var args = slice.call(arguments, 2);
        return this.wrap(fn).apply(ctx, args);
    };

    Signature.prototype.wrap = function (inner) {
        var outer = function () {
            var args = arguments,
                sig  = outer.contract,
                len  = sig.argTypes.length, 

                i, value, type, result;

            for (i = 0; i < len; i++) {
                value = args[i];
                type  = sig.argTypes[i];
                
                if (!Type.check(value, type)) {
                    throw new CallerBrokeContractError(value, type);
                }
            }

            result = inner.apply(this, args);

            if (!Type.check(result, sig.returnType)) {
                throw new ProviderBrokeContractError(value, type);
            }

            return result;
        };

        outer.contract = this;
        outer.innerFunction = inner;
        outer.toSource = function () {
            inner.toSource();
        };

        return outer;
    };

    Signature.prototype.argumentsMatch = function (args) {
        // args may be an array or an arguments object
	var length = this.argTypes.length, i;        

	for (i = 0; i < length; i++) {
	    if (!Type.check(args[i], this.argTypes[i])) {
		return false;
	    }    
	}	

	return true;
    };

    Signature.prototype.moreSpecificThan = function (sig) {
        sig = Signature.from(sig);

        var a = this.argTypes,
            b = sig.argTypes,
            len = a.length,
            max = b.length,
	    i;

        for (i = 0; i < len; i++) {
            if (i >= max || Type.moreSpecificThan(a[i], b[i])) {
                return true;
            }
        }

        return false;
    };

    Type.WrappedFunction = new Type.Specialized(Function, function (value) {
        return ('contract' in value) && Type.check(value.contract, Signature);
    });

    Type.WrappedFunction.moreSpecificThan = function (a, b) {
        Type.assert(a, Function);
        Type.assert(b, Function);

        var sig_a = a.contract,
            sig_b = b.contract;


        if (sig_a != null && sig_b != null) {
            return sig_a.moreSpecificThan(sig_b);
        } else {
            return sig_a != null;
        }
    };

    Type.Module    = Module;
    Type.Signature = Signature;
    Type.ProviderBrokeContractError = ProviderBrokeContractError;
    Type.CallerBrokeContractError = CallerBrokeContractError;
}());
