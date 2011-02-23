Type.proxy = function (obj, wrapper) {
    var clone, proxy, key, undef,

        proxy_method,
        proxy_accessors,

        Contract = Type.Contract,
        hasOwn = {}.hasOwnProperty;

    clone = function (obj) {
        var F = function () {};
        F.prototype = obj;
        return new F();
    };

    proxy = clone(obj); 
   
    proxy_method = function (name) {
        var method, contract;
       
        method = function () {
            return obj[name].apply(obj, arguments);
        };

        contract = hasOwn.call(wrapper, name) && Contract.from(wrapper[name]);
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
            getter = Contract.from([type]).wrap(getter);
            setter = Contract.from([type, type]).wrap(setter);
        }

        if (obj[getName] === undef) {
            proxy[getname] = getter;
        }
        
        if (obj[setName] === undef) {
            proxy[setname] = setter;
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
