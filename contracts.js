/*globals Type: false */
(function (){
    var Module, Signature,
        CallerBrokeContractError,
        ProviderBrokeContractError,
        slice, hasOwn;

    slice  = [].slice;
    hasOwn = {}.hasOwnProperty;

    Module = Type.Module = function (fn) {
        fn.call(this);
    };

    CallerBrokeContractError = function () {};
    CallerBrokeContractError.prototype = new TypeError();
    CallerBrokeContractError.prototype.name = "Caller Broke Contract";
    CallerBrokeContractError.prototype.message = "Caller Broke Contract";
    
    ProviderBrokeContractError = function () {};
    ProviderBrokeContractError.prototype = new TypeError();
    ProviderBrokeContractError.prototype.name = "Provider Broke Contract";
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
        var i    = arr.length - 1,
            sig  = new Signature();

        sig.argTypes = slice.call(arr, 0, i);
        sig.returnType = arr[i];

        return sig;
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

    Type.Module    = Module;
    Type.Signature = Signature;
    Type.ProviderBrokeContractError = ProviderBrokeContractError;
    Type.CallerBrokeContractError = CallerBrokeContractError;
}());
