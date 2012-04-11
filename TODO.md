Things to do
==

- Signature.wrap(function () { }) should return a WrappedFunction (Write Tests)
- WrappedFunction should be specialized on Type.Function and hold a reference to its signature (Write Tests)
- Separate contract.js out into {contract,signature,module}.js
- Type.dispatch could use the same mechanism as Generic
- Rename interface to protocol? they may to be closer to clojure protocols (@abishek)
- Tell more than 0 people about Type.js
- interface.js should provide an interface `IType` that you can implement to override the behaviour of Type.check and Type.from
