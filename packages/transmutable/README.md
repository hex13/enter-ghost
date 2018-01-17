### immutable objects that pretend to be mutable

### (now `transmutable` supports also environments without ES6 Proxies using fallback diffing algorithm).

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

So instead of forcing user to manually copying objects with `Object.assign` / `...`, it leaves this part to the library. The library presents you the `draft` (proxy object which records your mutations and creates some kind of patch).

This allows for performing smart deep copy (i.e. deep copy which is mutation-aware and performs only deep copies of "dirty" data. If something is not changed - it is copied by reference).

`transform` function returns immutable copy of original object, based on draft you made.

### Usage

`transform` function:

```javascript
const { transform, transformAt } = require('transmutable');

const original = {a: 123};

const copy = transform(draft => {
	draft.a = 456;
}, original);

console.log({original, copy});
// { original: { a: 123 }, copy: { a: 456 } }

```
transformAt for applying changes only in the slice of state (concept similar to functional lenses):

```javascript
const original = {
	some: {
		deep: {
			object: {
				foo: 123,
				bar: 'hello'
			}
		}
	}
}
const copy = transformAt(d => d.some.deep.object, d => {
	d.foo = 456;
	d.bar += ' world';
}, original);
```

Result will be:

```javascript
{
	some: {
		deep: {
			object: {
				foo: 456,
				bar: 'hello world'
			}
		}
	}
}
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


Times in ms (the lower the better).

Pushing 1000 objects to array. Repeated 10000 times.

1. Time for **transmutable** (transform function) - array: 1770ms
2. Time for immer without autofreeze - array:  2733ms

change one deep property in state. Repeated 10000 times.

1. Time for hand crafted reducer - example:  48ms
2. Time for **transmutable** (transform function)- example:  50ms
3. Time for immer without autofreeze - example:  98ms

Tested on:

Node v8.4.0

Transmutable: 0.11.0

Immer: 0.8.1

### Comparison

Differences with Immer.

* Transmutable is faster (look above)
* Transmutable has additional function `transformAt` for transforming only a slice of state
* `transform`/`produce` functions. Both libraries support parameter order: function, object. Both libraries support currying. But `immer` also supports object, function order.
* Immer supports frozen objects (it can be disabled). Transmutable does not support frozen objects.


### Gotchas


###### General:

* Transmutable assumes immutability, so you should not perform any mutation of your objects outside the `transmutable` API.

###### Things dependent on current implementation:

* In current version of Transmutable your state should be plain JS objects (numbers, strings, booleans, arrays, nested objects). You should not **currently** use e.g. ES6 Maps in your state. This may change in future versions.

* Your state should not contain circular references.

* Transmutable currently does not support frozen objects. Even if you freeze them by yourself (file an issue if this is a matter for you).
