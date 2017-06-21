"use strict";

const assert = require('assert');

const vfs = require('../2');



const { File } = vfs;


describe('when creating empty file', () => {
    let file;
    let mockPath = 'mock';

    beforeEach(() => {
        file = new File(mockPath);
    });

    it('file.path should have value taken from constructor', () => {
        assert.strictEqual(file.path, mockPath);
    });

    it('file.read() should resolve to empty string', () => {
        return file.read().then(contents => {
            assert.strictEqual(contents, '');
        });
    });

    it('it should be possible to use file.write() to write data, and then use file.read() for read this data', () => {
        return file.write('kotek').then(() => {
            return file.read().then(contents => {
                assert.strictEqual(contents, 'kotek');
            });
        });
    });

    it('it should be possible to use file.write() to write data (passing Promise as argument), and then use file.read() for read this data', () => {
        return file.write(Promise.resolve('piesek')).then(() => {
            return file.read().then(contents => {
                assert.strictEqual(contents, 'piesek');
            });
        });
    });

    it('it should be possible to connect file to virtual file system', () => {
        const map = new Map;
        const vfsMock = {
            read(file) {
                return Promise.resolve(file.path + map.get(file));
            },
            write(file, data) {
                return new Promise(resolve => {
                     map.set(file, data);
                     resolve();
                });
            }
        };
        file.connect(vfsMock);
        return file.write('hello').then(() => {
            return file.read().then(contents => {
                assert.strictEqual(contents, file.path + 'hello');
            });
        });
    });



});
