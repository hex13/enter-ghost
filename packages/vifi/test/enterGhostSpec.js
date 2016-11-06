"use strict";
const assert = require('assert');

const ghost = require('..');
const fs = require('fs');
const Path = require('path');


describe('ghost', () => {
    const path = Path.join(__dirname, '/../mock.json');

    const originalObject = {a: 1, b: 2};
    const originalContents = JSON.stringify(originalObject);

    beforeEach(() => {
        fs.writeFileSync(path, originalContents, 'utf8');
        

        delete require.cache[require.resolve('..')];    

        this.ghost = require('..');

        
        this.file = ghost.open(path);
        //TODO clear cache
    });
    
    // note: it can be deprecated in future
    it('should read from disk (using promises)', done => {    
        this.file.read().then(contents => {
            assert.equal(contents, originalContents);
            return 123;
        }).then(v => {
            assert.equal(v, 123);
            done();
        }).catch(done);
    });

    // proposed api

    it('should read from disk (using callback)', done => {    
        this.file.read(contents => {
            assert.equal(contents, originalContents);
            done();
        }).catch(done);
    });

    it('chaining test: read, then parse', done => {    
        let c = 0;
        const read = this.file.read(contents => {
            assert.equal(contents, originalContents);
            assert.equal(c++, 0);
        })
        .parse(obj => {
            assert.deepEqual(obj, originalObject);
            //assert.equal(c++, 1);
            done();
        });
    });    



    //------------

    it('should parse', done => {    
        this.file.parse().then(obj => {
            assert.deepEqual(obj, originalObject);
            done();
        }).catch(done);
    });    
    

    it('should read from `contents` property', done => {
        this.file.contents = 'kot';    
        this.file.read().then(contents => {
            assert.equal(contents, 'kot');
            done();
        }).catch(done);
    });

    


    
    it('should do mysterious things with files', done => {
            
        
        const file = this.ghost.open(path);
        
        assert.equal(file.path, path);

        const newContents = `{"abc":"${+new Date}}"`;
        file.read().then(contents => {
            assert.equal(contents, originalContents);
            file.write(newContents).then(() => {
                 const diskContents = fs.readFileSync(path, 'utf8');
                 assert.equal(diskContents, originalContents);
                 assert.equal(newContents, file.contents);
                 file.flush().then(() => {
                     const diskContents = fs.readFileSync(path, 'utf8');
                     assert.equal(newContents, diskContents);
                     done();
                 }).catch(done);
                  
            }).catch(done);
            
        });

    });
    
});