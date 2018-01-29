const H = require('handlebars');
const fs = require('fs');

const tpl = fs.readFileSync(__dirname + '/../' + 'README.md.tpl', 'utf8');
const data = {
    size: (fs.statSync(__dirname + '/../dist/transmutable.js').size / 1024).toFixed(2)
};
console.log(H.compile(tpl)(data));
