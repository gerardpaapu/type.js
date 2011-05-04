/*globals Type: false */
// Type.Interface is intended to be similar to a Haskell TypeClass
// in that it is a collection of Generics that are known to be implemented for various types
//
//
/* 
var Seq = new Type.Interface({
    first: [Seq, Type.Any],
    rest: [Seq, Seq],
    nth: [Seq, Number, Type.Any],
    isEmpty: [Seq, Boolean],
    length: [Seq, Number]
});

Seq.implement(Array, {
    first: function (seq) {
        return seq[0];
    },

    rest: function (seq) {
        return seq.slice(1);
    },

    nth: function (seq, n) {
        return seq[n];
    },

    isEmpty: function (seq) {
        return seq.length === 0;
    },

    length: function (seq) {
        return seq.length;
    }
});

var Stream = new Type.Class({
    Implements: Seq,

    initialize: function (first, rest) {
        this._first = first;
        this._rest = rest;
    },

    first: function () {
        return this._first;
    },

    rest: function () {
        return this._rest();
    },

    isEmpty: function () {
        return false;
    },

    nth: function (n) {
        var ls = this;

        while (n-- > 0) {
            ls = ls.rest();
        }

        return ls.first() ;
    },

    length: function () {
        var len = 0,
            ls = this; 

        while (!ls.isEmpty()) {
            len++;
            ls = ls.rest();
        }

        return len;
    }
});

var EmptyStream = new Type.Class({
    Extends: Stream,
    first: function () { throw new Error(); },
    rest: function () { throw new Error(); },
    nth: function (n) { throw new Error(); },
    isEmpty: function () { return true; },
    length: function () { return 0; }
});

var map = new Type.Generic();

map.defineMethod([Function, Seq], function (fn, ls) {
    var out = [],
        first = Seq.generics.first,
        rest  = Seq.generics.rest,
        isEmpty = Seq.generics.isEmpty;

    while (!isEmpty(ls)) {
        out.push(fn(first(ls)));
        ls = rest(ls);
    }

    return out;
});
*/
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
                this.methods[key].defineMethod([type], obj[key]);
            }
        }

        this.implemented = this.implemented.concat(type);
    };

    Interface.prototype.check = function (value) {
        var i, len;

        for (i = 0, len = this.implemented.length; i < len; i++) {
            if (this.implemented[i].check(value)) {
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
