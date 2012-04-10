Things to do
==

- Signature.wrap(function () { }) should return a WrappedFunction (Write Tests)
- WrappedFunction should be specialized on Type.Function and hold a reference to its signature (Write Tests)
- Separate contract.js out into {contract,signature,module}.js
- The dispatch table in generics should be populated with WrappedFunctions
- `signature_more_specific` should be moved to Signature::moreSpecificThan and Signature.moreSpecificThan (and perhaps called as WrappedFunction.moreSpecificThan)
- Type.dispatch could use the same mechanism as Generic
- Rename interface to protocol? they may to be closer to clojure protocols (@abishek)
- Tell more than 0 people about Type.js
- interface.js should provide an interface `IType` that you can implement to override the behaviour of Type.check and Type.from