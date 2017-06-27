/*### recordable state container. It allows for state injecting

```javascript

*/
class Calc {
   constructor(initial) {  // initial state is injected via powerful DI mechanism
       this.number = initial; // initial state is automatically set
   }
   add(number) { // no more action types, action creators, switch-case bullshit. Just plain methods
       this.number += number; // We don't force you to write immutable code. Mutations are allowed.
       console.log(this); // all changes are recorded and dumped into standard output
   }
};

const calc = new Calc(10); // we inject number 10.
calc.add(Math.pow(2, 5));

/*

```

*/
