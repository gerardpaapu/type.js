var Type = (function (undef) {
    var Type, 
        
        Null,
        NAN,
        Arguments,

        Duck, 
        Class, NativeClass, 
        Union, 
        Specialized,
        Predicate, 
        Any,

        isNativeType,

        // Comparison constants for sorting
        MORE  = 1,
        LESS  = -1,
        EQUAL = 0,

        hasOwn   = {}.hasOwnProperty, 
        slice    = [].slice,
        toObject, isFunction;

    toObject = function (val) {
        // Described in ECMA-262: Section 9.9
        if (val === null || val === undefined) {
            throw new TypeError();
        }

        switch (typeof(val)) {
            case "boolean":
            case "string":
            case "number":
                return Object(val);

            default:
                return val;
        }
    };

    isFunction = function (val) {
        return typeof(val) === "function" && val instanceof Function;
    };

    Type = function () { };

    Type.prototype.check = function (value) { return true; };
    Type.prototype.moreSpecificThan = function (type) { return false; };
    Type.prototype.lessSpecificThan = function (type) { return false; };
    Type.prototype.equals = function (type) { return this === type; };

    Type.moreSpecificThan = function (a, b) {
        a = Type.from(a);
        b = Type.from(b);

        return a.moreSpecificThan(b) || b.lessSpecificThan(a);
    };

    Type.lessSpecificThan = function (a, b) {
        a = Type.from(a);
        b = Type.from(b);

        return b.moreSpecificThan(a) || a.lessSpecificThan(b);
    };

    Type.sortValue = function (a, b) {
        return Type.equals(a, b)           ? EQUAL
            :  Type.moreSpecificThan(a, b) ? MORE
            :  Type.lessSpecificThan(a, b) ? LESS
            :                                EQUAL;
    };

    Type.equals = function (a, b) {
        return a === b || Type.from(a).equals(Type.from(b));
    };

    Type.from = function (t) {
        return t instanceof Type     ? t
            :  t == undef            ? Null
            :  t === Function        ? Type.Function
            :  isNativeType(t)       ? new NativeClass(t)
            :  t instanceof Function ? new Class(t)
            :  NAN.check(t)          ? NAN
            :  function () {
                throw new Error("Can't create type from: " + t);
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

    Null.moreSpecificThan = function (type) {
        return type !== Null;
    };

    Arguments = Type.Arguments = new Type();

    Arguments.check = function (value) {
        return typeof(value) === "arguments";
    };
    
    Class = Type.Class = function (constructor) {
        this.constructor = constructor;
    };

    Class.prototype = new Type();

    Class.prototype.check = function (value) {
        return value instanceof this.constructor;
    };

    Class.prototype.moreSpecificThan = function (type) {
        return Class.inheritsFrom(this, type);
    };

    Class.prototype.lessSpecificThan = function (type) {
        return Class.inheritsFrom(type, this);
    };

    Class.prototype.equals = function (type) {
        return type instanceof Class && type.constructor === this.constructor;
    };

    Class.inheritsFrom = function (a, b) {
        var child, parent;

        a = Type.from(a);
        b = Type.from(b);

        if (!(a instanceof Class && b instanceof Class)) {
            return false;
        } else {
            child  = a.constructor.prototype;
            parent = b.constructor.prototype;

            return parent.isPrototypeOf(child);
        }
    };


    NativeClass = Type.NativeClass = function () {
        Class.apply(this, arguments);
    };

    NativeClass.prototype = new Class();

    NativeClass.prototype.check = function (value) {
        return !(value === null || value === undef) && toObject(value) instanceof this.constructor;
    };

    Type.Function = new NativeClass(Function);
    Type.Function.check = isCallable;

    Predicate = Type.Predicate = function (test) {
        this.test = test;
    };    

    Predicate.prototype.check = function (value) {
        return this.test(value);
    };

    Predicate.prototype.lessSpecificThan = function (type) {
        return !(type instanceof Predicate);
    };

    Any = Type.Any = new Predicate(function (value) {
        return true;
    });

    Any.lessSpecificThan = function (type) { return true; };

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
            if (Type.check(value, this.subtypes[i])) {
                return true;
            }
        }

        return false;
    };

    Union.prototype.contains = function (type) {
        var i, length = this.subtypes;

        for (i = 0; i < length; i++) {
            if (Type.equals(this.subtypes[i], type)) {
                return true;
            }
        } 

        return false;
    };

    Union.prototype.lessSpecificThan = function (type) {
        return this.contains(type);
    };

    Specialized = Type.Specialized = function (type, test) {
        this.__super__ = Type.from(type);
        this.test = test;
    };

    Specialized.prototype = new Type();

    Specialized.prototype.check = function (value) {
        return Type.check(value, this.__super__) && this.test(value);
    };

    Specialized.prototype.moreSpecificThan = function (type) {
        return Type.equals(this.__super__, type) || this.__super__.moreSpecificThan(type);
    };

    NAN = Type.NAN = new Specialized(Number, isNaN);

    return Type;
}());
