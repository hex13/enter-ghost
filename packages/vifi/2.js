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

function vfs() {
    return {
        read(file) {
            return this._vfs.read(file);
        },
        write(file, data) {
            return this._vfs.write(file, data);
        },
        mount(root, vfs) {

            if (vfs.readFile) {
                const fs = vfs;
                vfs = {
                    read(file) {
                        return new Promise(resolve => {
                            fs.readFile(file.path, 'utf8', (err, data) => {
                                resolve(data);
                            });
                        });
                    },
                    write(file, data) {
                        return new Promise(resolve => {
                            fs.writeFile(file.path, data, 'utf8', () => {
                                resolve();
                            })
                        });
                    }
                }
            }
            this._vfs = vfs;
        }
    }
}



vfs.File = File;
module.exports = vfs;
