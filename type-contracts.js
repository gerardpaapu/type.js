(function (){
    var Module, Signature, Contract,
        CallerBrokeContractError,
        ProviderBrokeContractError,
        slice, hasOwn;

    slice  = Array.prototype.slice;
    hasOwn = Object.prototype.hasOwnProperty;

    Module = Type.Module = function (fn) { fn.call(this); };

    Module.prototype.provide = function (name, value, contract) {
        if (hasOwn.call(this, name)) { 
            throw Error(name + " already defined");
        }

        if (arguments.length < 3) {
            // no contract provided
            this[name] = value;
        } if (Type.check(contract, Signature)) {
            this[name] = contract.wrap(value); 
        } if (Type.check(contract, Array)) {
            this[name] = Signature.from(contract).wrap(value);
        } else {
            if (!Type.check(value, contract)) {
                throw ProviderBrokeContractError(value, contract);
            }

            this[name] = value;
        }
    };

    Signature = Type.Signature = function (/* arg_types..., return_type */) {
        var args = arguments,
            i = args.length - 1;

        this.arg_types = slice.call(args, i);
        this.return_type = args[i];
    };

    Signature.from = function (arr) {
        var args = arguments,
            i = args.length - 1,
            sig = new Signature();

        sig.arg_types = slice.call(args, i);
        sig.return_type = args[i];

        return sig;
    };

    Signature.prototype.wrap = function (inner) {
        var outer = function () {
            var args = arguments,
                sig = outer.contract,
                len = sig.arg_types.length, 
                i, value, type, result;

            for (i = 0; i < len; i++) {
                value = args[i];
                type  = sig.arg_types[i];
                
                if (!Type.check(value, type)) {
                    throw new CallerBrokeContractError(value, type);
                }
            }

            result = inner.apply(this, args);

            if (!Type.check(result, sig.return_type)) {
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
}());
