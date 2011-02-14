var Type = (function (undef) {
    var Type, Null, NAN, Duck, Class, NativeClass, Union, Predicate, Any,
        isNativeType,
        hasOwn = {}.hasOwnProperty, 
        slice  = [].slice;

    Type = function () { };

    Type.prototype.check = function (value) { return true; };

    Type.prototype.greaterThan = function (t) { return false; };

    Type.from = function (t) {
        return t instanceof Type     ? t
            :  t == undef            ? Null
            :  NAN.check(t)          ? NAN
            :  isNativeType(t)       ? new NativeClass(t)
            :  t instanceof Function ? new Class(t)
            :  function (){
                throw Error("Can't create type from: " + t);
            }();
    }; 

    Type.check = function (value, type) {
        return Type.from(type).check(value);
    };

    isNativeType = Type.isNativeType = function (type) {
        return type === String || type === Number || type === Boolean || type === Object;
    };

    Null = Type.Null = new Type();

    Null.check = function (value) {
        return value === null || value === undefined;
    };

    NAN = Type.NAN = new Type();

    NAN.check = function (value) {
        return typeof(value) === "number" && isNaN(value);
    };

    Class = Type.Class = function (constructor) {
        this.constructor = constructor;
    };

    Class.prototype = new Type();

    Class.prototype.check = function (value) {
        return value instanceof this.constructor;
    };

    Class.prototype.inheritsFrom = function (type) {
        var child = this.constructor.prototype,
            parent = type.constructor.prototype;

        return parent.isPrototypeOf(child);
    };

    NativeClass = Type.NativeClass = function () {
        Class.apply(this, arguments);
    };

    NativeClass.prototype = new Class();

    NativeClass.prototype.check = function (value) {
        switch (typeof(value)) {
            case "string":
            case "number":
            case "function":
            case "boolean":
                value = Object(value);
        }
        return value instanceof this.constructor;
    };

    Predicate = Type.Predicate = function (test) {
        this.test = test;
    };    

    Predicate.prototype.check = function (value) {
        return this.test(value);
    };

    Any = Type.Any = new Predicate(function (value) {
        return true;
    });

    Duck = Type.Duck = function (types) { this.types = types; };
    
    Duck.prototype = new Predicate();

    Duck.prototype.check = function (obj){
        var key, value, type, types = this.types;

        for (key in types) {
            if (hasOwn.call(types, key)) { 
                value = obj[key];
                type  = types[key];

                if (!(key in obj && Type.check(value, type))) {
                    return false;
                }
            } 
        }

        return true;
    };

    Union = Type.Union = function () {
        this.subtypes = slice.call(arguments);
    };

    Union.prototype = new Type();

    Union.prototype.check = function (value) {
        var i, length = this.subtypes.length;

        for (i = 0; i < length; i++) {
            if (Type.check(value, subtypes[i])) {
                return true;
            }
        }

        return false;
    };

    return Type;
}());
