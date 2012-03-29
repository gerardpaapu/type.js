/*global Type: false */
(function () {
    var undef, clone, mixin, hasOwn, slice;

    clone = function (obj) {
        var F = function () {};
        F.prototype = obj;
        return new F();
    };

    mixin = function (dest, sources) {
        var out = clone(dest),
            i, len, key, source;

        if (sources.length === 0) {
            return dest;
        }

        for (i = 0, len = sources.length; i < len; i++) {
            source = sources[i];
            for (key in source.prototype) {
                if (hasOwn.call(source, key)) {
                    out[key] = source[key];
                }
            }
        } 

        return out;
    };

    slice = [].slice;
    hasOwn = {}.hasOwnProperty; 

    Type.proxy = function (obj, wrapper) {
        var proxy, key,

            proxy_method,
            proxy_accessors,

            Signature = Type.Signature;

        proxy = clone(obj); 
       
        proxy_method = function (name) {
            var method, contract;
           
            method = function () {
                return obj[name].apply(obj, arguments);
            };

            contract = hasOwn.call(wrapper, name) && Signature.from(wrapper[name]);
            proxy[name] = contract ? contract.wrap(method) : method;
        };

        proxy_accessors = function (name) {
            var name_, type,
                setName, getName,
                getter, setter;

            name_ = name.slice(0, 1).toUpperCase() + name.slice(1);
            type  = hasOwn.call(wrapper, name) && Type.from(wrapper[name]);

            getName = 'get' + name_;
            setName = 'set' + name_;

            getter = function () {
                return obj[name];
            };

            setter = function (value) {
                return (obj[name] = value);
            };

            if (type) {
                getter = Signature.from([type]).wrap(getter);
                setter = Signature.from([type, type]).wrap(setter);
            }

            if (obj[getName] === undef) {
                proxy[getName] = getter;
            }
            
            if (obj[setName] === undef) {
                proxy[setName] = setter;
            }
        };

        for (key in obj) {
            if (Type.typeString(obj[key]) === "function") {
                proxy_method(key); 
            } else if (key.charAt(0) != '_') {
                proxy_accessors(key);
            }
        }

        return proxy;
    };

    Type.defineClass = function (obj) {
        var _extends, _super, type, mixins, interfaces, proto, 
            contracts, constructor, 
            key, match;

        // these properties are hints to `defineClass`
        // so we cache them now and delete them before
        // they would be shoved onto the prototype
        _extends    = obj.Extends    || Object; 
        interfaces  = obj.Implements || [];
        mixins      = obj.Mixins     || [];
        type        = obj.Type       || Type.Any;

        delete obj.Extends;
        delete obj.Mixins;
        delete obj.Type;

        _super = mixin(_extends.prototype, mixins);
        proto = clone(_super);

        contracts = {};

        for (key in obj) {
            if (hasOwn.call(obj, key)) {
                match = /^contract:(.*)/.exec(key);
                if (match) {
                    contracts[match[1]] = obj[key];
                } else {
                    proto[key] = obj[key];
                }
            }
        }
        
        constructor = function () {
            var instance, proxy;

            if (!(this instanceof constructor)) {
                instance = clone(constructor.prototype);
                return constructor.apply(instance, arguments);
            }

            proxy = Type.proxy(this, contracts);

            if (Type.typeString(proxy.initialize) === "function") {
                proxy.initialize.apply(proxy, arguments);
            }

            if (!type.check(proxy)) {
                throw new TypeError("class' type constraint failed");
            }

            return proxy;
        };

        // This should fulfill all appropriate
        (function () {
            var i, len, generics, key, methods, implementation, demethod;
            
            demethod = function (key) {
                return function (obj) {
                    var args = slice.call(arguments, 1);
                    return obj[key].apply(obj, args);
                };
            };

            for (i = 0, len = interfaces.length; i < len; i++) {
                generics = interfaces[i].generics;
                implementation = {};
                for (key in generics) {
                    if (hasOwn.call(generics, key)) {
                        implementation[key] = demethod(key);
                    }
                }

                interfaces[i].implement(new Type.Class(constructor), implementation);
            } 
        }.call(this));

        proto.constructor = constructor;
        proto.__super__ = _super;
        constructor.prototype = proto;

        return constructor;
    };
}());
