### immutable objects that pretend to be mutable


* It allows for mutable-like programming interface.
* It performs smart deep cloning (with dirty checking) - if something is not changed, it is copied only by reference


Transmutable allows you for writing this:

```javascript
copy = transform(stage => {
	stage.bar.baz = 123;
}, foo);
```

instead of this (spread operator helps only a little - notice repetitions, manually coping state at each level):

```javascript
copy = {
  ...foo,
    bar: {
      ...foo.bar,
      baz: 123
    }
}
```

or even this (even more verbose with `Object.assign`):

```javascript
copy = Object.assign(
  {},
  foo,
  {
    bar: Object.assign(
      {},
      foo.bar,
      {baz: 123}
    )
  }
)
```



Transmutable is based on idea that immutability should not come at the cost of developer experience.

So instead of forcing user to manually copying objects with `Object.assign` / `...`, it leaves this part to the library. The library presents you the `draft` (proxy object which record your mutations and create some kind of patch).

This allows for performing smart deep copy (i.e. deep copy which is mutation-aware and performs only deep copies of "dirty" data. If something is not changed - it is copied by reference).

`transform` function returns immutable copy of original object, based on draft you made.

### Usage

`transform` function:

```javascript
const { transform } = require('transmutable');

const original = {a: 123};

const copy = transform(draft => {
	draft.a = 456;
}, original);

console.log({original, copy});
// { original: { a: 123 }, copy: { a: 456 } }

```

With Redux:

```javascript
const { transform } = require('transmutable');
const { createStore } = require('redux');

// when transform gets only one argument it returns curried function
const reducer = transform((state, action) => {
	switch (action.type) {
		case 'inc':
			state.counter++;
			break;
		case 'concat':
			state.text += action.text;
			break;
	}
});
const initialState = {counter: 1, text: ''};
const store = createStore(reducer, initialState);

store.dispatch({type: 'inc'});
store.dispatch({type: 'inc'});
store.dispatch({type: 'inc'});
store.dispatch({type: 'concat', text: 'Hello'});
store.dispatch({type: 'concat', text: ' '});
store.dispatch({type: 'concat', text: 'world'});

assert.deepStrictEqual(
	store.getState(),
	{counter: 4, text: 'Hello world'}
);
// initial state has not changed :)
assert.deepStrictEqual(initialState, {counter: 1, text: ''});

```


### Performance

Check out [benchmark code](https://github.com/hex13/enter-ghost/blob/master/packages/transmutable/benchmark.js).

Transmutable is faster than Immer but slower than hand crafted reducer.

Times in ms.

Pushing 1000 objects to array. Repeated 10000 times.

* Time for **transmutable** - array:  2220ms
* Time for immer without autofreeze - array:  8362ms

change one deep property in state. Repeated 10000 times.

* Time for hand crafted - example:  62ms
* Time for **transmutable** - example:  78ms
* Time for immer without autofreeze - example:  548ms

Tested on:

Node v8.4.0

Transmutable: 0.9.0

Immer: 0.3.1

### Comparison

Differences with Immer.

* Transmutable is faster (look above)
* `transform`/`produce` functions. Both libraries support parameter order: function, object. Both libraries support currying. But `immer` also supports object, function order.
* Immer supports frozen objects (it can be disabled), and ES5 environments. Transmutable does not support frozen objects and demand environment with support of ES Proxies. This may change in the future though.


### Gotchas


###### General:

* Transmutable assumes immutability, so you should not perform any mutation of your objects outside the `transmutable` API.

###### Things dependent on current implementation:
* Transmutable uses ES6 Proxies and it demands environment capable for running such Proxy.

* In current version of Transmutable your state should be plain JS objects (numbers, strings, booleans, arrays, nested objects). You should not **currently** use e.g. ES6 Maps in your state. This may change in future versions.

* Your state should not contain circular references.

* Transmutable currently does not support frozen objects. Even if you freeze them by yourself (file an issue if this is a matter for you).
