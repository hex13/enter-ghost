"use strict";

const { wrapClass } = require('./debug');

class File {
    constructor(path, contents = '') {
        this._contents = Promise.resolve(contents);
        this.path = path;
        this._resolveTarget = null;
    }
    read() {
        if (typeof arguments[arguments.length - 1] == 'function') {
            throw new Error('File::read() doesn\'t support callback anymore');
        }

        if (this._resolveTarget) {
            return this._proxyMethod('read');
        }

        if (this._vfs) {
            return this._vfs.read(this);
        }

        return this._contents;
    }
    write(data) {
        if (this._resolveTarget) {
            return this._proxyMethod('write', data);
        }

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
    snapshot(opts = {}) {
        const FileClass = opts.cls || File;
        const extra = opts.extra || [];
        return this
            .read()
            .then(contents => new FileClass(this.path, contents, ...extra));
    }
    _proxyMethod(meth, ...args) {
        return Promise.resolve(this._resolveTarget()).then(target => {
            return target[meth](...args);
        });
    }
    proxy(resolveTarget) {
        this._resolveTarget = resolveTarget;
    }
}

//wrapClass(File);

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
    constructor() {
        this._loaders = [];
        this._mountingPoints = [];
    }
    getMountPoint(file) {
        return this._mountingPoints.find(mp => file.originalPath.indexOf(mp.root) == 0);
    }
    open(path) {
        const file = new File(path);
        file.originalPath = path;
        const mp = this.getMountPoint(file);
        if (mp && mp.root != '/') {
            file.path = file.path.slice(mp.root.length);
        }
        file.connect(this);
        return file;
    }
    read(file) {
        const mp = this.getMountPoint(file);
        return mp.vfs.read(file);
    }
    write(file, data) {
        const mp = this.getMountPoint(file);
        return mp.vfs.write(file, data);
    }
    mount(root, vfs) {
        if (vfs.readFile) {
            vfs = new NodeFsWrapper(vfs);
        }
        this._mountingPoints.push({
            root, vfs
        });
    }
    loader(loader) {
        this._loaders.push(loader);
    }
    load(file, opts) {
        return this._loaders[0](file);
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
