// const WAS_WRITTEN = Symbol();
// const METHOD = Symbol();
// const MUTATION = 'MUTATION'
// const WAS_ACCESSED = 'WAS_ACCESSED'


const WAS_WRITTEN = Symbol();
const METHOD = Symbol();
const MUTATION = Symbol('transmutable/mutation');
const WAS_ACCESSED = Symbol();
const DRAFT = Symbol();
const SELECTOR = Symbol();
// TODO change into Symbol (but Transmutable currently does not clone symbols...)
const AUTO = '@@auto'//Symbol();

const symbols = {};
['ENTITY'].forEach(name => {
    symbols[name] = '@@' + name.toLowerCase();
});
module.exports = Object.assign({ WAS_ACCESSED, WAS_WRITTEN, METHOD, MUTATION, DRAFT, SELECTOR, AUTO }, symbols);
