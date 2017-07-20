const createEvent = require('./createEvent');

class Recorder {
    constructor() {
        this._calls = [];
    }
    record(event) {
        this._calls.push(event);
    }
    reset() {
        if (this._calls.length) this._calls = [];
    }
    getCalls() {
        return this._calls;
    }
    undo(cb) {
        this._calls.pop();
        this._calls.forEach(cb);
    }
}


const systems = {
    runHandlerAndNotify() {
        return {
            dispatch(actionData) {
                const { original, value, model, name, args } = actionData;
                if (name.charAt(0) == '$') return;
                const res = original.apply(model, [model.state].concat(args));
                model._root.$afterChildAction(model, name);
                model.$notify(model);
                actionData.value = res;
            }
        }
    },
    record() {
        return {
            register(model, api) {
                api.component(model, 'recorder', new Recorder);
            },
            dispatch(actionData, data, api) {
               const { value, model, name, args } = actionData;
               const recorder = api.component(api.root(model), 'recorder');
               if (name == '$undo') {
                   const tmp = api.model(new model.constructor());
                   recorder.undo(event => {
                       api.dispatch(tmp, event);
                   });

                   model.state = tmp.get();
                   model.$notify(model);
                   return;
               } else if (name.charAt(0) == '$') return;

               recorder.record(createEvent(model, name, args));
            }
        }
   },
   reducers() {
       return {
           dispatch(actionData) {
               actionData.model.state = actionData.value;
           }
       }
   }
};
module.exports = systems;
