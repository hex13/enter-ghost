### immutable objects that pretend to be mutable

##### New in 0.12.0:
##### Now you can replace the whole state just by returning a new value. It works in both `transform` and `transformAt`.

This allows you for deciding when you want to transform only some properties and when you just want to replace a whole state:

```javascript
function dec(d) {
    if (d.counter > 0)
        d.counter--; // mutation-like mode
    else
        return {message: 'countdown finished'}  // "returnish" mode
}

for (var i = 0, state = {counter:3}; i < 4; i++) {
    state = transform(dec, state);
    console.log(state)
}
// logs:
// { counter: 2 }
// { counter: 1 }
// { counter: 0 }
// { message: 'countdown finished' }

```

You can also use it feature for transforming selected properties when using `transformAt`:

```javascript
transformAt(['foo', 'bar'], bar => bar + 1, {
    foo: {
        bar: 10
    }
}); // returns: { foo: { bar: 11 } }
```

It provides mutable-like interface for immutable code. No more `...` / `Object.assign`. Now this is handled automatic (via ES6 Proxies or fallback diffing if Proxies are not available).

1. You create a normal JS object
2. You run `transform` function (or `transformAt` if you want to  apply changes to the slice of state)

```javascript
const o1 = {
    some: {
        object: {
            animal: 'cat'
        }
    },
    notTouched: {
        abc: 123
    }
};

const o2 = transform((d) => {
    d.some.object.animal = 'dog';
}, o1);

```

It performs then smart deep cloning (with dirty checking) - if something is not changed, it is copied only by reference (structural sharing) so you don't lose your immutable references.

![screenshot](https://raw.githubusercontent.com/hex13/enter-ghost/master/packages/transmutable/screenshot-transmutable.png)

It allows for reducing of boilerplate traditionally associated with writing immutable code in JavaScript (especially in libraries like Redux).


Consider more mainstream approach...

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

This is just wrong. Not very readable or maintainable.

And heres comes Transmutable for the rescue.

Transmutable is based on idea that immutability should not come at the cost of developer experience.

So instead of forcing user to manually copying objects with `Object.assign` / `...`, it leaves this part to the library. The library presents you a `draft` (proxy object which records your mutations and creates some kind of patch).

Then patch is applied and you have effect similar to nested `...` / `Object.assign` madness but handled automatically for you.

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
`transformAt` for applying changes only in the slice of state (concept similar to functional lenses):

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
const copy = transformAt(['some', 'deep', 'object'], d => {
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
