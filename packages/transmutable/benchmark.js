const { transform } = require('./transmutable');
const { createExample }= require('./testUtils');
const immer = require('immer').default;
let max = 10000;

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
    console.log(`Time for ${name}: `, t1 - t0)
}

benchmark(() => {
    return transform(transformer, original);
}, 'transmutable')

benchmark(() => {
    return immer(original, transformer);
}, 'immer')
