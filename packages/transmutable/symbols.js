// const WAS_WRITTEN = Symbol();
// const METHOD = Symbol();
// const MUTATION = 'MUTATION'
// const WAS_ACCESSED = 'WAS_ACCESSED'

const WAS_WRITTEN = Symbol();
const METHOD = Symbol();
const MUTATION = Symbol();
const WAS_ACCESSED = Symbol();
const DRAFT = Symbol();
const SELECTOR = Symbol();
// TODO change into Symbol (but Transmutable currently does not clone symbols...)
const AUTO = '@@auto'//Symbol();
module.exports = { WAS_ACCESSED, WAS_WRITTEN, METHOD, MUTATION, DRAFT, SELECTOR, AUTO };
