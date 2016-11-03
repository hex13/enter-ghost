"use strict";

const EventEmitter = require('events').EventEmitter;
const Path = require('path');

const isString = v => typeof v == 'string' || v instanceof String;

let c = 100;
const File = (what) => {
    const path = what.path || what;
    const file = {
        path,
        id: c++,

        read: () => ghost.read(file),
        get: (prop) => ghost.get(file, prop),
        parse: () => ghost.parse(file),
        stringify: (obj) => ghost.stringify(file, obj),
        write: (contents) => ghost.write(file, contents),
        flush: () => ghost.flush(file),

        extname: () => ghost.extname(file),
        mime: () => ghost.mime(file),

        test: () => ghost.test(file),
    };
    return file;  
}


const ghost = {
    fs: {
        
    },
    getOrCreate(what) {
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
    on(file, func) {
        return this.ee.on(this.id(file), func);
    },
    emit(file, func) {
        return this.ee.emit(this.id(file), func);
    },
    extname: file => Path.extname(file.path),
    
    open(what) {
        return this.getOrCreate(what);
    },
    
    read(f) {
        const filesystem = this.filesystem(f);
        if (f.contents != undefined || !filesystem)
            return Promise.resolve(f.contents);
        else {
            return f.contents = filesystem.read(f);
        }
    },
    filesystem(file) {
        if (file.fs) 
            return file.fs;
        const path = file.path;
        if (path.indexOf('mem://') == 0)
            return undefined
        return this.fs;
    },
    write(f, contents) {
        return new Promise(resolve => {
            f.contents = contents;
            f.parsedContents = undefined;
            f.description = undefined;
			resolve(f);            
        });
    },
    flush(f) {
        return this.fs.flush(f);
    },
    get(f, prop) {
        if (f[prop])
            return Promise.resolve(f[prop]);
        else {
            const getter = this.getters[prop];
            return f[prop] = getter? getter(f): Promise.resolve();
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

// example setters
ghost.getters = {
    ast: (file) => {
        
        return Promise.resolve(`this is AST for ${file.path} ${c++}`);
    },
    description: (file) => {
        return file.parse().then(obj => {
         	return `this is ${obj.animal} and eats ${obj.food}`;
        });
    }
}

ghost.fs.read = (file) => {

    return new Promise(resolve => {
        fs.readFile(file.path, 'utf8', (err, contents) => {
            if (!err) {
                resolve(contents);
            } else {
                resolve(undefined);
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

ghost.parse = (file) => {
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
};

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

