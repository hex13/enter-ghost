"use strict";

class File {
    constructor(path, contents = '') {
        this._contents = Promise.resolve(contents);
        this.path = path;
    }
    read() {
        if (this._vfs) {
            return this._vfs.read(this);
        }
        return this._contents;
    }
    write(data) {
        if (this._vfs) {
            return this._vfs.write(this, data);
        }
        return new Promise(resolve => {
            this._contents = Promise.resolve(data);
            resolve();
        });
    }
    connect(vfs) {
        this._vfs = vfs;
    }
    snapshot() {
        const snapshot = new File(this.path);
        return snapshot.write(this.read())
            .then(() => {
                return snapshot;
            });
    }
}

function wrapClass(Class) {
    Object.getOwnPropertyNames(Class.prototype).forEach(prop => {
        const originalMethod = Class.prototype[prop];
        Class.prototype[prop] = function (...args) {
            console.log(`${Class.name}::${prop}`, args)
            return originalMethod.apply(this, args);
        }
    });
}

wrapClass(File);

class NodeFsWrapper {
    constructor(fs) {
        this._fs = fs;
    }
    inspect() {
        return '[NodeFsWrapper]'
    }
    read(file) {
        return new Promise(resolve => {
            this._fs.readFile(file.path, 'utf8', (err, data) => {
                resolve(data);
            });
        });
    }
    write(file, data) {
        return new Promise(resolve => {
            this._fs.writeFile(file.path, data, 'utf8', () => {
                resolve();
            })
        });
    }
}

class MainFileSystem {
    open(path) {
        const file = new File(path);
        file.connect(this);
        return file;
    }
    read(file) {
        return this._vfs.read(file);
    }
    write(file, data) {
        return this._vfs.write(file, data);
    }
    mount(root, vfs) {
        if (vfs.readFile) {
            vfs = new NodeFsWrapper(vfs);
        }
        this._vfs = vfs;
    }
}

function vfs(vfsToMount) {
    const mainVfs = new MainFileSystem;
    if (vfsToMount) {
        mainVfs.mount('/', vfsToMount);
    }
    return mainVfs;
}



vfs.File = File;
module.exports = vfs;
