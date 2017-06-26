const MemoryFileSystem = require('../filesystems/MemoryFileSystem');
const File = require('../2').File;
const assert = require('assert');

describe('when creating MemoryFileSystem', () => {
    let memFs;
    beforeEach(() => {
        memFs = new MemoryFileSystem({
            '/abc': 'this is a test.',
            '/def': 'this is not a test.',
        });
    });
    it('should be possible to read file', () => {
        const file = new File('/abc');
        return memFs.read(file)
            .then(contents => {
                assert.strictEqual(contents, 'this is a test.');
            })
            .then(() => memFs.read(new File('/def')))
            .then(contents => {
                assert.strictEqual(contents, 'this is not a test.');
            });

    });

    it('should be possible to write to file (and then read changed contents)', () => {
        const file = new File('/abc');
        return memFs.write(file, 'this was a test.')
            .then(() => memFs.read(file))
            .then(contents => {
                assert.strictEqual(contents, 'this was a test.');
            })
            .then(() => memFs.read(new File('/def')))
            .then(contents => {
                assert.strictEqual(contents, 'this is not a test.');
            });
    });

});
