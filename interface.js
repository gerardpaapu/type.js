/*globals Type: false */
// Type.Interface is intended to be similar to a Haskell TypeClass
// in that it is a collection of Generics that are known to be implemented for various types
(function () {
    var Interface,
        hasOwn = {}.hasOwnProperty;

    Interface = Type.Interface = function (obj) {
        var key, value;

        this.generics = {};

        for (key in obj) {
            if (hasOwn.call(obj, key)) {
                this.generics[key] = new Type.Generic();
            }
        }
    };

    Interface.prototype = new Type();
    
    Interface.prototype.implemented = [];
    
    Interface.prototype.implement = function (type, obj) {
        var key, value;

        for (key in obj) {
            if (hasOwn.call(obj, key)) {
                value = obj[key];
                this.generics[key].defineMethod([type], obj[key]);
            }
        }

        this.implemented = this.implemented.concat(type);
    };

    Interface.prototype.check = function (value) {
        var i, len;

        for (i = 0, len = this.implemented.length; i < len; i++) {
            if (Type.check(value, this.implemented[i])) {
                return true;
            }
        } 

        return false;
    };

    Interface.prototype.lessSpecificThan = function (type) {
        var i, len;

        for (i = 0, len = this.implemented; i < len; i++) {
            if (this.implemented[i] === type) {
                return true;
            }
        }

        return false;
    };
}.call(null));
