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

    log(forked.stage); // { cow: 123, dogs: { muchWow: 1 } }

const copied = forked.commit();

    log(copied); // { cow: 456, dogs: { muchWow: 888888 } }
    log(original); // { cow: 123, dogs: { muchWow: 1 } }


```

* It allows for mutable-like programming interface.
* It allows for applying mutations either in immutable (via `forked.commit()`) or mutable way (via `forked.pushTo`).
