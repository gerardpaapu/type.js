var Type = (function (global) {
    var Type, 
        
        Null,
        NAN,
        Arguments,

        Duck, 
        Class,
        BuiltinClass, 
        Union, 
        Specialized,
        Predicate, 
        Any,

        isBuiltin,

        // Comparison constants for sorting
        MORE  = 1,
        LESS  = -1,
        EQUAL = 0,

        hasOwn   = {}.hasOwnProperty, 
        slice    = [].slice,
        toString = {}.toString,
        indexOf,
        undef, // undefined

        toObject,
        typeString;

    Type = function () {};

    indexOf = indexOf || function (needle) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] === needle) {
                return i;
            }
        } 

        return -1;
    };

    toObject = Type.toObject = function (val) {
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

    typeString = Type.typeString = function (val) {
        // The internal property [[Class]] of a given javascript
        // object is a reliable way to identify various builtins
        //
        // ECMA-262 8.6.2 discusses the internal properties
        // common to all Ecmascript Objects including [[Class]]
        //
        // ECMA-262 15.2.4.2 discusses the use of
        // Object.prototype.toString to observe [[Class]]

        return val == global ? "global"
            :  val == undef  ? String(val)
            :  toString.call(val).slice(8, -1).toLowerCase();
    };

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
            :  isBuiltin(t)          ? new BuiltinClass(t)
            :  t instanceof Function ? new Class(t)
            :  NAN.check(t)          ? NAN
            :  (function () {
                throw new Error("Can't create type from: " + t);
            }());
    }; 

    Type.check = function (value, type) {
        return Type.from(type).check(value);
    };

    isBuiltin = Type.isBuiltin = function (type) {
        return indexOf.call(Type.__builtins__, type) !== -1;
    };

    Type.__builtins__ = [Number, Boolean, String, Array, Function, RegExp];

    Null = Type.Null = new Type();

    Null.check = function (value) {
        return value == undef;
    };

    Null.moreSpecificThan = function (type) {
        return type !== Null;
    };

    Arguments = Type.Arguments = new Type();

    Arguments.check = function (value) {
        return typeString(value) === "arguments";
    };
    
    Class = Type.Class = function (constructor) {
        this.constructor = constructor;
    };

    Class.prototype = new Type();

    Class.prototype.check = function (value) {
        return value != undef && toObject(value) instanceof this.constructor;
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

    BuiltinClass = Type.BuiltinClass = function () {
        Class.apply(this, arguments);
        this.typeString = typeString(new this.constructor());
    };

    BuiltinClass.prototype = new Class();

    BuiltinClass.prototype.check = function (value) {
        return typeString(value) === this.typeString;
    };

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

    Type.ArrayOf = function (type) {
        type = Type.from(type);

        return new Specialized(Array, function (value) {
            var i, len;
            for (i = 0, len = value.length; i < len; i++) {
                if (!type.check(value[i])) {
                    return false;
                }
            }

            return true;
        });
    };

    return Type;
}(this));
