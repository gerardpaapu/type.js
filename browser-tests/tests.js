test("Check nulls", function () {
    ok(Type.check(null, null),      "null is Null");
    ok(Type.check(undefined, null), "undefined is Null");
    ok(Type.check(null, Type.Null), "using Type.Null");
    ok(!Type.check({}, Type.Null),   "Object is not null");
});

test("Check NaNs", function () {
    ok(Type.check(NaN, NaN),      "NaN");
    ok(Type.check(1/"p", NaN),    "NaN (division by string)");
    ok(Type.check(NaN, Type.NAN), "NaN using Type.NAN");
    ok(!Type.check(10,   NaN),    "Not a NaN");
});

test("Check Native classes", function () {
    ok(Type.check("testing", String), "String");
    ok(Type.check(10,   Number),      "Number");
    ok(Type.check(true, Boolean),     "Boolean");
    ok(Type.check([],   Array),       "Array");

    ok(Type.check(new String("cats"), String), "String with constructor");
    ok(Type.check(new Number(7),      Number),  "Number with constructor");
    ok(Type.check(new Boolean(true),  Boolean), "Boolean with constructor");
    ok(Type.check(new Array(10),      Array),   "Boolean with constructor");

    ok(!Type.check(10,   String),  "Not a String");
    ok(!Type.check("10", Number),  "Not a Number");
    ok(!Type.check(10,   Boolean), "Not a Boolean");
    ok(!Type.check(10,   Array),   "Not an Array");
});

test("checking some other classed", function () {
    ok(Type.check(/poo/, RegExp), "regexp from literal");
    ok(Type.check(new RegExp("poo"), RegExp), "regexp from constructor");
    ok(!Type.check("poo", RegExp), "not a regexp");
});

test("What is Object?", function () {
    ok(Type.check({}, Object),   "{} is Object");
    ok(Type.check(new Object(), Object),   "new Object() is Object");

    ok(Type.check("", Object),   "\"\" is Object");
    ok(Type.check(new String(), Object),   "new String() is Object");

    ok(Type.check(function (){}, Object), "function () {} is Object");
    ok(Type.check(new Function(), Object), "new Function() is Object");

    ok(Type.check(1, Object),             "1 is Object");
    ok(Type.check(new Number(), Object),  "new Number() is Object");
    ok(Type.check(NaN, Object),           "NaN is Object");

    ok(!Type.check(null, Object),      "null is not Object");
    ok(!Type.check(undefined, Object), "undefined is not Object");
});

test("Type specificity", function () {
    ok(Type.moreSpecificThan(null, NaN));
    ok(Type.moreSpecificThan(NaN, Number));
    ok(Type.moreSpecificThan(Number, Object));
});

test("Multimethod dispatch", function () {
    var Cons, length, test, isList;

    Cons = function (a, b) {
        this.head = a;
        this.tail = b;
    };

    length = new Generic();

    length.defineMethod([Cons], function (ls) {
        return 1 + length( ls.tail );
    });

    length.defineMethod([null], function (ls) {
        return 0;
    });

    isList = new Generic();

    isList.defineMethod([ null ], function (ls) { return true; });

    isList.defineMethod([ Cons ], function (ls) {
        return isList(ls.tail);
    });

    isList.defineMethod([ Object ], function (ls) {
        return false;
    });

    test = new Cons(1, new Cons(2, null));

    ok(length(test) === 2,
       "length((1 2)) is 2");

    ok(isList(test),
       "isList((1 2))");

    ok(!isList(new Cons(1, 2)),
       "! isList((1 . 2))");
});

test("Multimethod dispatch PART DEUX", function () {
    var classify = new Generic(),
        Integer  = new Type.Specialized(Number, function (n) {
                      return parseInt(n, 10) == n;
                   });

    classify.defineMethod([Number], function (n) {
        return "number";
    });

    classify.defineMethod([NaN], function (n) {
        return "NaN";
    });

    classify.defineMethod([Integer], function (n) {
        return "integer";
    });

   equals(classify(1), "integer");
   equals(classify(1.5), "number");
   equals(classify(NaN), "NaN");
});
