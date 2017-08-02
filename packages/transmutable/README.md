### immutable objects that pretend to be mutable

Example:

```javascript

const transmutable = require('transmutable').transmutable();
const log = console.log.bind(console);

const original = {
    cow: 123,
    dogs: {
        muchWow: 1
    }
};

const forked = transmutable.fork(original);
forked.stage.cow = 456;
forked.stage.dogs.muchWow = 888888;
    log(forked.reify()); // { cow: 456, dogs: { muchWow: 888888 } }
    log(forked.stage.dogs); // { muchWow: 1 }

const copied = forked.commit();

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

**reify()** - materializes mutations without committing. 

**commit()** - materializes mutations with committing. So it's like reify, but with side-effects: mutations are reset and `stage` properties are updated to match next state.
