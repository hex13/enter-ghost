### immutable objects that pretend to be mutable


it enables for writing this:

```javascript
copy = transform(foo, stage => {
	stage.bar.baz = 123;
});
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

There are two modes of using:

- easy (high level)
- reusable (low level)

Easy mode is just one function: `transform`


NOTE: full Transmutable objects are deprecated and will be probable be moved to another package / changed / or removed completely. If you want to have immutability helper, just use `transform`.
====

Reusable mode involves creating a `Transmutable` object which stores `target` (original object), `stage` (proxied object) and `mutations` (array which contains data about mutations). It also has methods `reify` (it materializes mutations and returns a new changed object) and `commit` (like `reify` but it resets mutations and advances `target` property to the next state).

Transmutable library assumes immutability, so you should not perform any mutation of your objects (because of data-sharing between objects). Off course using `transmutable` API and "mutating" the `stage` is not mutation, because mutations are only recorded on `stage`, and not yet applied.



Example of use:

```javascript
const log = console.log.bind(console);

const { Transmutable, transform } = require('transmutable');


const original = {
    cow: 123,
    dogs: {
        muchWow: 1
    }
};

// easy way:

const copy = transform(original, stage => {
    stage.cow = 'doge';
});

        log(copy); // { cow: 'doge', dogs: { muchWow: 1 } }
        log(original); // still the same: { cow: 123, dogs: { muchWow: 1 } }
        log(copy.dogs === original.dogs); // true


// or using more detailed API. We create reusable Transmutable object

const t = new Transmutable(original);
t.stage.cow = 456;
t.stage.dogs.muchWow = 888888;

        log(t.reify()); // { cow: 456, dogs: { muchWow: 888888 } }
        log(t.stage.dogs); // { muchWow: 1 }

const copied = t.commit();

        log(copied); // { cow: 456, dogs: { muchWow: 888888 } }
        log(original); // { cow: 123, dogs: { muchWow: 1 } }
```

* It allows for mutable-like programming interface.
* It allows for applying mutations either in immutable (via `forked.commit()`) or mutable way (via `forked.pushTo`).
* It performs smart deep cloning (with dirty checking) - if something is not changed, it is copied only by reference

properties of Transmutable object:
====

**stage** enables for recording mutations, but it doesn't mutate neither original object neither stage object itself.
It may be implemented by Proxy or by getters/setters (but this is technical detail, don't rely on it).

**reify()** - materializes mutations without committing. It returns smart copy of original object with applied mutations.

**commit()** - materializes mutations with committing. So it's like reify, but with side-effects: mutations are reset and `stage` properties are updated to match next state.
