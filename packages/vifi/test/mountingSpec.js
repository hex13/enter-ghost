const assert = require('assert');

const vfs = require('..');

const files = [
    {path: 'abc', contents: 'Abecadło'},
    {path: 'def', contents: 'z pieca spadło.'},
];


describe('vifi mounting', () => {
    let unmount;
    before(() => {
        unmount = vfs.mountFromArray(files);
    });
    after(() => {
        unmount();
    });

    it('abc', () => {
        return vfs.open('abc').read().then(contents => {
            assert.equal(contents, files[0].contents)
        });
    })
    it('def', () => {
        return vfs.open('def').read().then(contents => {
            assert.equal(contents, files[1].contents)
        });
    })

});
