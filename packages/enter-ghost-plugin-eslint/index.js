const eslint = require('eslint');
const linter = eslint.linter;

module.exports = () => {
    const lint = file => {
        return file.read().then(contents => {
            linter.reset();
            const messages = linter.verify(contents, {
                env: {es6: true, node:true, browser: true},
                parserOptions: {
                    ecmaVersion: 6,
                    sourceType: 'module',
                    ecmaFeatures: {
                        jsx: true
                    }
                },
                rules: {
                    'no-undef': 2
                }
            }, file.path, true /*TODO false?*/);
            return messages;
        });

    };

    return {
        services: {
            lint
        }
    };
}
