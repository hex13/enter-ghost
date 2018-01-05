"use strict";

const assert = require('assert');

// classic-style reducer:
// const reducer = (state, action) => {
//     switch (action.type) {
//         case 'inc':
//             return Object.assign({}, state, {counter: state.counter+1});
//         case 'concat':
//             return Object.assign({}, state, {text: state.text + action.text})
//         default:
//             return state;
//     }
// };


describe('redux interop', () => {
    it('should work with redux', () => {
        const { Reducer } = require('../transform.js');
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
        assert.deepStrictEqual(store.getState(), {counter: 4, text: 'Hello world'});
        // initial state has not changed :) 
        assert.deepStrictEqual(initialState, {counter: 1, text: ''});
    });
});
