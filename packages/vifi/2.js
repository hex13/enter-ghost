"use strict";

class File {
    constructor(path) {
        this._contents = Promise.resolve('');
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
}

module.exports = {
    File
};
