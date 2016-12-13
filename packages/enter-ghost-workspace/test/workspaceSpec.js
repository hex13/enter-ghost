const assert = require('assert');
const createWorkspace = require('..');
const {EventEmitter} = require('events');
const fs = require('fs');

describe('Workspace', () => {
    it('should open, modify, and save file', (done) => {
        const path = __dirname + '/../mock.js';
        const app = require('../../enter-ghost-app')();
        const workspace = createWorkspace(app);
        fs.writeFileSync(path, 'const a = "kotek"');
        const newContents = 'var a = 1';

        workspace.command('open', {paths: [path]}).then((ctx) => {
            assert(ctx.file);
            return ctx.file.write(newContents).then(() => ctx);
        })
        .then(ctx => {
            workspace.command('save').then(() => {
                assert.equal(fs.readFileSync(path, 'utf8'), newContents);
                done();
            }).catch(done);

        })
        .catch(done);

    });
});
