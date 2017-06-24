"use strict";

const assert = require('assert');

const vifi = require('../2');



const { File } = vifi;


describe('when creating file', () => {
    it('should be possible to pass initial contents in constructor', () => {
        const file = new File('test', 'wlazł kotek na płotek');
        return file.read().then(contents => {
            assert.strictEqual(contents, 'wlazł kotek na płotek');
        });
    });

});

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

    it('it should be possible get an independent snapshot after connecting file to virtual file system', () => {
        const map = new Map;
        const vfsMock = {
            read(file) {
                return Promise.resolve(map.get(file.path));
            },
            write(file, data) {
                return new Promise(resolve => {
                    map.set(file.path, data);
                    resolve();
                });
            }
        };
        file.connect(vfsMock);
        return file
            .write('hello')
            .then(() => file.snapshot())
            .then(function writeToOriginalFile(snapshot) {
                // for checking if snapshot is independent
                return file
                    .write('other data')
                    .then(() => {
                        return snapshot
                    });
            })
            .then(snapshot => {
                assert(snapshot instanceof File);
                assert(snapshot != file);
                assert.strictEqual(snapshot.path, file.path);

                return snapshot.read();
            }).then(contents => {
                assert.strictEqual(contents, 'hello');
        });
    });


});


describe('having main virtual file system', () => {
    it('it should be possible to open file', () => {
        const vfs = vifi();
        const file = vfs.open('/whatever');
        assert.strictEqual(file.path, '/whatever');
        assert(file instanceof File);
    });

    it('it should be possible to mount another virtual file system at \'/\' path', () => {
        const vfs = vifi();
        vfs.mount('/', {
            read(file) {
                return Promise.resolve(file.number);
            },
            write(file, data) {
                return new Promise(resolve => {
                    file.number += data;
                    resolve();
                });
            }
        });
        const file = vfs.open('/whatever');
        file.number = 2;

        return file.read().then(contents => {
            assert.strictEqual(contents, 2, 'files open in main system should delegate "read" action to the mounted file system');
            return file.write(3).then(() => {
                assert.strictEqual(file.number, 5, 'files open in main system should delegate "write" action to the mounted file system');
            });
        });
    });

    describe('and having NodeJS like virtual file system ', () => {
        let writtenData;
        let fsMock;
        let vfs;

        beforeEach(() => {
            writtenData = [];
            fsMock = {
                readFile(path, encoding, cb) {
                    cb(null, path + '::contents')
                },
                writeFile(path, data, encoding, cb) {
                    writtenData.push([path, data]);
                    cb(null);
                }
            }
        });

        function verify() {
            const file = vfs.open('/some-file');
            file.number = 2;

            return file.read().then(contents => {
                assert.strictEqual(contents, '/some-file::contents', 'read() of the main file system should delegate action to the mounted file system');
                return file.write(3).then(() => {
                    assert.deepEqual(
                        writtenData,
                        [['/some-file', 3]],
                        'write() of the main file system should delegate action to the mounted file system'
                    );
                });
            });
        }
        it('it should be possible to mount NodeJS like virtual file system at \'/\' path (via ::mount)', () => {
            vfs = vifi();
            vfs.mount('/', fsMock);
            return verify();
        });

        it('it should be possible to mount NodeJS like virtual file system by injecting fs into factory', () => {
            vfs = vifi(fsMock);
            return verify();
        });


    })
});
