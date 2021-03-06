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

    it('it should be possible to get snapshot with custom class', () => {
        class CustomFile extends File {
            constructor(path, contents, ...extra) {
                super(path, contents);
                this.extra = extra;
            }
        }
        return file.snapshot({cls: CustomFile, extra: ['yo', 'yo!']}).then(snapshot => {
            assert(snapshot instanceof CustomFile);
            assert.deepEqual(snapshot.extra, ['yo', 'yo!'], 'extra arguments should be passed to snapshot\'s constructor');
        });

    });

    // TODO remove code dupplication {
    it('it should be possible to proxy when passing function which returns file', () => {
        const target = new File('kotek', 'piesek');
        file.proxy(() => target);
        return file.read()
            .then(contents => {
                assert.strictEqual(contents, 'piesek');
            })
            .then(() => file.write('drugi piesek'))
            .then(() => target.read())
            .then(contents => {
                assert.strictEqual(contents, 'drugi piesek');
            })
    });

    it('it should be possible to proxy when passing function which returns promised file', () => {
        const target = new File('kotek', 'piesek');
        file.proxy(() => Promise.resolve(target));
        return file.read()
            .then(contents => {
                assert.strictEqual(contents, 'piesek');
            })
            .then(() => file.write('drugi piesek'))
            .then(() => target.read())
            .then(contents => {
                assert.strictEqual(contents, 'drugi piesek');
            })
    });
    // TODO } remove code dupplication



});


describe('having main virtual file system', () => {
    xit('it should be possible to open file', () => {
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

    it('it should be possible to mount two virtual file systems at different paths', () => {
        const vfs = vifi();
        const createVfs = (propName) => {
            return {
                read(file) {
                    return Promise.resolve(file[propName]);
                },
                write(file, data) {
                    return new Promise(resolve => {
                        file[propName] = data;
                        resolve();
                    });
                }
            }
        };
        vfs.mount('/foo', createVfs('foo'));
        vfs.mount('/bar', createVfs('bar'));

        const file = vfs.open('/foo/whatever');
        assert.strictEqual(file.path, '/whatever', `file should have path relative to the mount point and it has ${file.path}`)
        file.foo = 'foo123';

        const file2 = vfs.open('/bar/whatever2');
        assert.strictEqual(file2.path, '/whatever2', `file should have path relative to the mount point and it has ${file.path}`)
        file2.bar = 'bar123';

        const readWrite = (file, propName) => {
            return file.read().then(contents => {
                assert.strictEqual(contents, propName + '123');
                return file.write(propName + '456').then(() => {
                    assert.strictEqual(file[propName], propName + '456');
                });
            })
        }
        return Promise.all([
            readWrite(file, 'foo'),
            readWrite(file2, 'bar'),
        ]);
    });


    it('it should be possible to register loader and load file as object', () => {
        const vfs = vifi();
        vfs.loader(file => {
            return file.read().then(contents => {
                return {text: contents};
            });
        });
        const f = new File('abc.txt', 'To jest kotek');
        return vfs.load(f).then(obj => {
            assert.deepEqual(obj, {text: 'To jest kotek'});
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
