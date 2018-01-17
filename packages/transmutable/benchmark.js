const assert = require('assert');

const { transform } = require('./dist/transmutable');
const { State } = require('./state');
const { createExample }= require('./testUtils');
const immer = require('immer').default;
const {setAutoFreeze } = require('immer');



const {benchmarks} = require('./docData');
setAutoFreeze(false);
let max = benchmarks.max;

const original = {
    arr: []
};
for (let i = 0; i < 1000; i++) {
    original.arr.push({a: i})
}

function transformer(state) {
    for (let i = 0; i < 100; i++) {
        state.arr[i].done = true;
    }
}
function benchmark(code, name) {
    let t0 = Date.now() ;
    let res;
    for (let i = 0; i < max; i++)
        res = code();
    //console.log(original.arr.length, res.arr.length)
    let t1 = Date.now();
    console.log(`Time for ${name}: `, `${t1 - t0}ms`)
}

benchmark(() => {
    return transform(transformer, original);
}, 'transmutable (transform function) - array')


benchmark(() => {
    const P = Proxy;
    Proxy = undefined;
    transform(transformer, original);
    Proxy = P;
}, 'transmutable (diffing) - array')


benchmark(() => {
    const state = new State(original);
    state.run(transformer);
    return state.get();
}, 'transmutable (State object)- array')


benchmark(() => {
    return immer(original, transformer);
}, 'immer without autofreeze - array');

benchmark(() => {
    return immer(createExample(), (state) => {
        state.c.d = {};
    });
}, 'immer without autofreeze - example')

benchmark(() => {
    return transform((state) => {
        state.c.d = {};
    }, createExample());
}, 'transmutable - example');


benchmark(() => {
    const P = Proxy;
    Proxy = undefined;
    transform((state) => {
        state.c.d = {};
    }, createExample());
    Proxy = P;
}, 'transmutable (diffing) - example')


benchmark(() => {
    const state = createExample();
    const res = Object.assign(
        {},
        state,
        {c: Object.assign({}, state.c, {d: {}})},
    )

    // const expected = createExample();
    // expected.c.d = {};
    // assert.deepStrictEqual(res, expected);
    return res;
    // return transform((state) => {
    //     state.c.d = {};
    // }, );
}, 'hand crafted - example')
