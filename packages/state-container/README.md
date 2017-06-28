### Recordable state container. It allows you to program in modern OOP and still have time travelling and other goodies.

Notice: this is an early version. Proof of concept. Not ready for production yet.

```javascript

        const { Model } = require('state-container');

        class Example extends Model {
            $getInitialState(value) {
                return {value};
            }
            inc(amount) {
                this.value += amount;
            }
        }

        const model = new Example(100);

        model.subscribe(() => {
            console.log("update your view here");
            console.log("current state:", model.state);
        });

        // notice that each call will trigger handler passed in `subscribe`
        model.inc(100);
        model.inc(200);

        console.log("UNDO!");

        // this uses event sourcing under the hood:
        model.undo();
```
