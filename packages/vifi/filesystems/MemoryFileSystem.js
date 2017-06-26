module.exports = class MemoryFileSystem {
    constructor(files) {
        this._files = files;
    }
    read(file) {
        const contents = this._files[file.path];
        return Promise.resolve(contents);
    }
    write(file, data) {
        this._files[file.path] = data;
        return Promise.resolve();
    }
};
