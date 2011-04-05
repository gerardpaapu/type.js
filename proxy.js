/*global Type: false */
(function () {
    var undef, clone, implement, hasOwn, slice;

    clone = function (obj) {
        var F = function () {};
        F.prototype = obj;
        return new F();
    };

    implement = function (dest, sources) {
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
            } else {
                proxy_accessors(key);
            }
        }

        return proxy;
    };

    Type.defineClass = function (obj) {
        var _extends, _super, type, _implements, proto, 
            contracts, constructor, 
            key, match;

        // these properties are hints to `defineClass`
        // so we cache them now and delete them before
        // they would be shoved onto the prototype
        _extends    = obj.Extends    || Object; 
        _implements = obj.Implements || [];
        type        = obj.Type       || Type.Any;

        delete obj.Extends;
        delete obj.Implements;
        delete obj.Type;

        _super = implement(_extends.prototype, _implements);
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

        proto.__constructor__ = constructor;
        proto.__super__ = _super;
        constructor.prototype = proto;

        return constructor;
    };
}());
