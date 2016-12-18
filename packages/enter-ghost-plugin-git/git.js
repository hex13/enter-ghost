const git = require('git-utils');
const Path = require('path');

module.exports = () => {
    const vcs = (file) => {
        const repo = git.open(Path.dirname(file.path));
        return new Promise(resolve => {
            file.read().then(contents => {

                const relPath = Path.relative(Path.dirname(repo.getPath()), file.path);
                resolve(repo.getLineDiffs(relPath, contents));
            })
        });

    };

    return {
        services: {
            vcs
        }
    }
};
