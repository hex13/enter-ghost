### immutable objects that pretend to be mutable

### Change in API:
**now transforming function is a FIRST argument of `transform` and original state is a SECOND.**


it enables for writing this:

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

So instead of forcing user to manually copying objects with `Object.assign` / `...`, it leaves this part to the library. The library presents you the `stage` (proxied object which passively observes each mutation being made). This allows for performing smart deep copy (i.e. deep copy which is mutation-aware and performs only deep copies of "dirty" data. If something is not changed - it is copied by reference). Then mutations are "replayed" and applied to the copy of object.

### Usage

With Redux:

```javascript
const { Reducer } = require('transmutable');
const { createStore } = require('redux');

const reducer = Reducer((state, action) => {
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

There are two modes of using:

- transform function
- ~~reusable (low level)~~ Transmutable objects are removed
- Reducer helper


**NOTE: full Transmutable objects are removed. .**


Transmutable library assumes immutability, so you should not perform any mutation of your objects (because of data-sharing between objects). Off course using `transmutable` API and "mutating" the `stage` is not mutation, because mutations are only recorded on `stage`, and not yet applied.



Example of use:

```javascript
const log = console.log.bind(console);

const { transform } = require('transmutable');


const original = {
	cow: 123,
	dogs: {
		muchWow: 1
	}
};


const copy = transform(stage => {
	stage.cow = 'doge';
}, original);

		log(copy); // { cow: 'doge', dogs: { muchWow: 1 } }
		log(original); // still the same: { cow: 123, dogs: { muchWow: 1 } }
		log(copy.dogs === original.dogs); // true





```

* It allows for mutable-like programming interface.
* It allows for applying mutations either in immutable (via `forked.commit()`) or mutable way (via `forked.pushTo`).
* It performs smart deep cloning (with dirty checking) - if something is not changed, it is copied only by reference
