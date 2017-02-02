const { join } = require('path');
module.exports = {
    url: 'file://' + join(__dirname, 'index.html'),
    rendererMain: join(__dirname, 'rendererMain.js'),
};
