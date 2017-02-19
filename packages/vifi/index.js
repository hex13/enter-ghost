"use strict";

const EventEmitter = require('events').EventEmitter;
const Path = require('path');

const isString = v => typeof v == 'string' || v instanceof String;

let c = 100;
const File = (what) => {

    const dict = new Map;
    const path = what.path || what;
    const contents = what.contents;
    const file = {
        path,
        id: c++,
        timestamp: Date.now(),

        read: (cb) => ghost.read(file, cb),
        get: (...args) => ghost.get(file, ...args),
        set: (...args) => ghost.set(file, ...args),
        parse: (...args) => ghost.parse(file, ...args),
        stringify: (obj) => ghost.stringify(file, obj),
        write: (contents) => ghost.write(file, contents),
        flush: () => ghost.flush(file),

        extname: () => ghost.extname(file),
        basename: () => ghost.basename(file),
        dirname: () => ghost.dirname(file),
        mime: () => ghost.mime(file),

        test: () => ghost.test(file),
        query: (...args) => ghost.query(file, ...args),

        get: k => dict.get(k),
        set: (k, v) => dict.set(k, v),

        stat: (...args) => ghost.stat(file, ...args),
        contents,
      	touch: (...args) => ghost.touch(file, ...args),
    };
    return file;
}



const defer = (func,name) => (file, callback) => {
    const promise = new Promise(function(resolve) {
        const result = func(file);
        if (callback) {
            result.then(callback);
        }
        resolve(result);
    });
    return {
        then: promise.then.bind(promise),
        catch: promise.catch.bind(promise),
        parse: (...args) => promise.then(v => file.parse(...args)),
    };
};

const ghost = {
    defer,
    fs: {

    },
    save(file) {
        file.flush();
    },
    retrieveOrCreate(what) {
        const id = this.id(what);
		if (this._cache.has(id))
            return this._cache.get(id);
        else {
            const cached = File(what);
            this._cache.set(id, cached);
            return cached;
		}
    },
    _cache: new Map,
    ee: new EventEmitter,
    id: file => file.path || file,
    //id: (file, sub) => {
    //     return (sub? `${sub}@` :'') + (file.path || file);
    // },
    state(inst, data) {
        return data;
    },
    service(name, handler) {
        // TODO rename `getters` to `services`
        this.getters[name] = handler;

    },
    acquire(file, methods, opts = {}) {


        if (file.acquired) {
            if (opts.force) {
                console.log("FORCED ACQ");
                this.release(file);
            } else
                throw new Error(`file ${file.path} was already acquired`);
        }
        file.old = {};
        file.acquired = true;

        Object.keys(methods).forEach(name => {
            //file.old.set(name, file[name]);
            file.old[name] = file[name];
            file[name] = defer(methods[name]).bind(null, file);
        });
        file.owner = opts.owner;

        return Promise.resolve();
    },
    release(file) {
        Object.assign(file, file.old);
        file.old = undefined;
        file.acquired = false;
        file.owner = undefined;
    },
    //TODO
    // usage
    // vifi.open(...).transform([a,b,c])
    // implementation:
    // read => trans 1 => trans 2 => trans n => write
    transform(file, transformers) {

    },
    on(file, func) {
        return this.ee.on(this.id(file), func);
    },
    emit(file, func) {
        return this.ee.emit(this.id(file), func);
    },
    extname: file => Path.extname(file.path),
    basename: file => Path.basename(file.path),
    dirname: file => Path.dirname(file.path),
    basedirname: file => Path.basename(Path.dirname(file.path)),

    // TODO flags
    // wildcards, then treat many people as one
    // vifi.open('*.js','*').transform([babel, uglify])
    open(what, flags) {
        return this.retrieveOrCreate(what);
    },

    read: defer((f) => {
        const filesystem = ghost.filesystem(f);
        if (f.contents != undefined || !filesystem) {
            return Promise.resolve(f.contents);
        } else {

            const res = f.contents = filesystem.read(f);
            return res;
        }

    }, 'read'),
    filesystem(file) {
        if (file.fs)
            return file.fs;
        const path = file.path;
        if (path.indexOf('mem://') == 0)
            return undefined
        return this.fs;
    },
    mount(path, filesystem) {
        // TODO mounting filesystems
    },
    write(f, contents) {
        return new Promise(resolve => {
            f.contents = contents;
            f.parsedContents = undefined;
            f.description = undefined;
			resolve(f);
        });
    },
    touch(f) {
       f.timestamp = Date.now();
    },
    flush(f) {
        return this.fs.flush(f);
    },
    query(f, prop, ...args) {
        //TODO switching: cacheable/not cacheable props
        if (false && f[prop])
            return Promise.resolve(f[prop]);
        else {
            const getter = this.getters[prop];
            const result = f[prop] = getter? getter(f, ...args) : undefined;
            if (result)
                return result;
            else {
                console.error(`Can't find service '${prop}'`);
                Promise.resolve();
            }
            //return f[prop] = getter? getter(f, ...args): Promise.resolve();
        }
    },
    mime(file) {
        console.warn('ghost.mime: this function is not implemented completely.');

        const mimes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.json': 'application/json',
            '.jsx': 'text/javascript',
            '.css': 'text/css',
        };
        const ext = this.extname(file);
        return mimes.hasOwnProperty(ext) && mimes[ext];
    }

};



const fs = require('fs');

module.exports = ghost;

let mountFromArrayWarning = 0;
ghost.mountFromArray = (files) => {
    const vfs = ghost;
    if (!mountFromArrayWarning++)
        console.warn('Vifi: method `mountFromArray` currently replaces `open` method. You won\'t be able to open files from disk. This behavior can change in future versions')
    const oldOpen = vfs.open;
    vfs.open = (path) => {
        const f = vfs.File(path);
        f.contents = files.find(f => f.path == path).contents;
        return f;
    };
    return () => {
        vfs.open = oldOpen;
    };
};


ghost.stat = defer((f) => {
    return new Promise((resolve, reject) => {
        fs.stat(f.path, (err, stats) => {
            console.log("STATSY JAKIE", f.path,stats)
            stats? resolve(stats) : reject(err);
        })
    });
});

ghost.getters = {};
// example setters
// ghost.getters = {
//     ast: (file) => {
//
//         return Promise.resolve(`this is AST for ${file.path} ${c++}`);
//     },
//     description: (file) => {
//         return file.parse().then(obj => {
//          	return `this is ${obj.animal} and eats ${obj.food}`;
//         });
//     }
// }

ghost.fs.read = (file) => {

    return new Promise((resolve, reject) => {
        fs.readFile(file.path, 'utf8', (err, contents) => {
            if (!err) {
                resolve(contents);
            } else {
                reject(err)
                //resolve(undefined);
            }
        });
    });
};

ghost.fs.flush = (file) => {
    return file.read().then(contents => {
        return new Promise(resolve => {
            fs.writeFile(file.path, contents, err => {
                resolve();
            });
        });
    });
};

ghost.parse = defer((file) => {

    if (file.parsedContents != undefined) {
        return file.parsedContents;
    } else {
        file.parsedContents = ghost.read(file).then(contents => {
            if (ghost.extname(file) == '.json') {
                return JSON.parse(contents);
            }
            return contents;
        });
        return file.parsedContents;
    }
}, 'parse');

ghost.stringify = (file, obj) => {
    const toJSON = (obj) => Promise.resolve(JSON.stringify(obj, null,2));
    if (obj != undefined) {
		file.contents = toJSON(obj);
        return file.contents;
    }

    return ghost.parse(file).then(parsedContents => {
		file.contents = toJSON(parsedContents);
        return file.contents;
    });

}

ghost.File = File;


// TODO move this to spec
// const code = ghost.open({path:__dirname + '/abc.json'});
// const animals = code;


// animals.parse().then(obj => {
// 	animals.stringify({
//         food: 'acorns and nuts 🌰',
//         animals: 'squirrels & chipmunks 🐿🐿🐿'
//     }).then(()=> {
//         animals.flush();
//     });
// });



// const inmem = ghost.open('mem://abc');

// inmem.read = () => {
//     return Promise.resolve('kotek');
// };

// inmem.fs = {
//     read: () => Promise.resolve('kotek')
// };

// inmem.read().then(c => {
//     console.log('22222222',c);
// });

// ghost.read(inmem).then(c => {
//     console.log('111122222222',c);
// });
