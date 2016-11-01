"use strict";
const assert = require('assert');
const ghost = require('..');
const fs = require('fs');
const Path = require('path');


describe('ghost', () => {
    it('should do mysterious things with files', done => {
        const path = Path.join(__dirname, '/../mock.json');
        
        const file = ghost.open(path);
        let originalDiskContents = fs.readFileSync(path, 'utf8');
        assert.equal(file.path, path);

        const newContents = `{"abc":"${+new Date}}"`;
        file.read().then(contents => {
            assert.equal(contents, originalDiskContents);
            file.write(newContents).then(() => {
                 const diskContents = fs.readFileSync(path, 'utf8');
                 assert.equal(diskContents, originalDiskContents);
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
