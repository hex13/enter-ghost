### Vistate: smart actionable models instead of one big state container



#### *state of project: not ready for use in production YET. But keep watching*.

Examples of use:

```javascript

const { vistate } = require('vistate');

const model = vistate.model({
    data: {value: 100},
    actions: {
        inc(state, amount) {
            state.value += amount;
        }
    }
});

model.$subscribe(() => {
    console.log("update your view here");
    console.log("current state:", model.get());
    renderYourView();
});

model.inc();

```


### Assumptions

1. ***Action dispatching*** is conceptually the same as ***method call***

```js
object.dispatch({type: 'increment', payload: 30});
```

is conceptually the same as:

```js
object.increment(30);
```

We just have some object (e.g. **model**, **store**, **entity** etc.) and we send messages to it (It is nothing new, it's just the old school OOP.).

But method calling requires less boilerplate so the approach `object.increment(30)` is preffered to the first one.

2. Sometimes we just need intelligent **models** which encapsulate both **state** and **logic**

3. Sometimes we need whole hierarchy of **models**

   ```
   [  -------------------------- Todo application -------------------------- ]
      	[ TodoList ]           	[ TodoList ]              	[ TodoList ]
       |      |      |        |      |      |             |      |      |
    [Todo] [Todo] [Todo]    [Todo] [Todo] [Todo]        [Todo] [Todo] [Todo]
                                      ^
     					we like to send an action to this Todo
   ```


   And it should be possible to send **action** to the specific **model** and work on **model level** (not the **store** level or the **observable property** level).  

4. Logic of dispatching the action and updating the state should be hidden from the library user.  Although the user commands **model** to dispatch the action, actual logic of dispatching is encapsulated in different object - the **entity **.  **Model** is just a high level abstraction over an **entity**.

   When an user sends action to the model:

 ```javascript
   counter.increment(30)
 ```

this could be dispatched in any way possible through the **entity** object. Action could be automatically recorded, previous state could be saved, subcribers could be notified. These things work automatically behind scenes, mainly in middleware. Middleware modules are called **systems**. Systems are assigned to **entities** during creation. They control various aspects on application logic (there is system which triggers domain logic, system for notyifing observers, system for recording events etc.). Each **system** can have its private data. Such data is called a **component**. This is based on Entity-Component-System pattern.

5. Projects should be easily debuggable and inspectable (there will be **Dev Tools** for Vistate soon, look into online-demo: [https://hex13.github.io/demos/todo/](https://hex13.github.io/demos/todo/))

6. Built-in solution for side-effects and asynchronicity (currently there are **transactions** for this purpose).

7. **Embracing inspiration**

   Vistate takes inspiration from *Redux, MVC, Smalltalk, SAM pattern, CQRS, event sourcing, DDD, Entity Component System, Vue, Vuex, Mobx, React, Django, Backbone, Rx, Redux Saga* and many other things.

   This means that although there could be some similarities with many other libraries and approaches but Vistate is not bound to one philosophy but it's inspired by many.

8. Immutability / mutability is an implementation detail.

   This framework started as being mutable. It promoted mutation of models directly in the action handlers:

   ```javascript
   ....
   increment(state) {
     state.value += 1;
   }
   ....
   ```

   Now there is ongoing transition to use immutable data, but the API stays the same. In current implementation action handlers just don't receive real **state** but only **proxy** objects. When an action handler calls

   ```javascript
   state.value += 1;
   ```

   This mutation is only recorded (not yet applied). This is the **model** that really applies these mutations. This is inspired by [SAM pattern](http://sam.js.org/) and its "proposed values". But the difference is that in Vistate there is a little bit syntax sugar to it.  To achieve this a little library called [transmutable](npmjs.com/package/transmutable) was created. You can try it yourself.

   ​



for examples of use check test cases because they are most recent source of truth: <https://github.com/hex13/enter-ghost/blob/master/packages/vistate/test/stateContainerSpec.js>

API is not stable yet so there can be breaking changes.

Latest breaking changes:

- 02/08/2017: remove `model.state` (use `model.get()`)
- 02/08/2017: subscriber is now called asynchronously
- 30/07/2017: Model class is gone. Create model from blueprints instead.
- 30/07/2017: model.$transaction and model.$register is gone
- 29/07/2017: $initialState is gone (use `data` param instead)
- 28/07/2017: $afterChildAction is gone
- no data() method in Transaction.
- transaction methods return promise
