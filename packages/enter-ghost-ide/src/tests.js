const fs = require('fs');
const Path = require('path');
const mock1 = Path.join(__dirname, 'mock1.js');
const mock2 = Path.join(__dirname, 'mock2.js');

fs.writeFileSync(mock1, 'function abc() {}');
fs.writeFileSync(mock2, 'const a = 1');

setTimeout(() => {
    return;
    const workspace = window.workspace;

    workspace.command('open', {paths:[mock1, mock2]}).then(() => {

        setTimeout(() => {
            const cm = window.TEST_MAP.get(mock1);

            const newContents = 'function def() {}' + Math.random();
            cm.setValue(newContents);
            cm.focus();


            workspace.command('save').then(() => {
                const fileContents = fs.readFileSync(mock1, 'utf8');
                if (fileContents != newContents) {
                    alert('didn\'t saved');
                } else
                    alert('ok');
                    //throw 'Ok. It saves';
            });

        }, 1000)
        // setTimeout(() => {
        //     const fileContents = fs.readFileSync(mock1, 'utf8');
        //     if (fileContents != newContents) {
        //         //throw 'It should save!';
        //         alert('should');
        //     } else
        //             alert('ok');
        //         //throw 'Ok. It saves';
        //
        // }, 2000);
        //
    });
}, 4000);
