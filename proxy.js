(function () {
    var undef, clone, hasOwn;

    clone = function (obj) {
        var F = function () {};
        F.prototype = obj;
        return new F();
    };

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

            name_ = name[0].toUpperCase() + name.slice(1);
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
            if (typeof obj[key] === "function") {
                proxy_method(key); 
            } else {
                proxy_accessors(key);
            }
        }

        return proxy;
    };

    Type.defineClass = function (obj) {
        var _super, type, proto, 
            contracts, constructor, 
            key, match;
        
        _super = obj.Extends || Object; 
        type = obj.Type || Type.Any;

        delete obj.Extends;
        delete obj.Type;

        proto = clone(_super.prototype);
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

            if (!this instanceof constructor) {
                instance = clone(constructor.prototype);
                return constructor.apply(instance, arguments);
            }

            proxy = Type.proxy(this, contracts);

            if (typeof(proxy.initialize) === 'function') {
                proxy.initialize.apply(proxy, arguments);
            }

            if (!type.check(proxy)) {
                throw TypeError("instance doesn't make classes type");
            }

            return proxy;
        };

        proto.__constructor__ = constructor;
        proto.__super__ = _super.prototype;
        constructor.prototype = proto;

        return constructor;
    };
}());
