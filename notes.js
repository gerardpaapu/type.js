/*globals Type: false */
// Just a bunch of notes from 
// sifting through ECMA-262
(function () {
    var toPrimitive, defaultValue, isPrimitive;

    toPrimitive = Type.toPrimitive = function (obj) {
        // Described in ECMA-262: Section 9.11
        if (obj === undefined || obj === null) {
            return obj;
        }

        return isPrimitive(obj) ? obj : defaultValue(obj);
    };

    defaultValue = function(obj, hint) {
        // Described in ECMA-262: Section 8.12.
        var value;

        if (hint === String) {
            if (Type.Function.check(obj.toString)) {
                value = obj.toString();
                if (isPrimitive(value)) {
                    return value;
                }
            }
            
            if (Type.Function.check(obj.valueOf)) {
                value = obj.valueOf();
                if (isPrimitive(value)) {
                    return value;
                }
            }

            throw new TypeError();
        }
        
        if (hint === Number) {
            if (Type.Function.check(obj.valueOf)) {
                value = obj.valueOf();
                if (isPrimitive(value)) {
                    return value;
                }
            }

            if (Type.Function.check(obj.toString)) {
                value = obj.toString();
                if (isPrimitive(value)) {
                    return value;
                }
            }
            
            throw new TypeError();
        }
        
        if (obj instanceof Date) {
            return defaultValue(obj, String);
        } else {
            return defaultValue(obj, Number);
        }
    };

    isPrimitive = function (val) {
        switch (typeof(val)) {
            case "boolean":
            case "string":
            case "number":
                return true;

            default:
                return false;
        }
    };

}());
