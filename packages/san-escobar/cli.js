const fs = require('fs');
const parseEventsFromLogs = require('./parseEventsFromJsonLogs');

const args = process.argv;
let file, prefix;


if (args[2].indexOf('--prefix') == 0) {
    prefix = new RegExp(args[3]);
    file = args[4];
} else if (args.length == 3) {
    file = args[2];
    prefix = '';
} else {
    console.log("example usage:\n 1. node cli.js somelogFile \n 2. node cli.js --prefix '.*?san-escobar: ' someLogFile");
    process.exit();
}

const s = fs.readFileSync(file, 'utf8');
const events = parseEventsFromLogs(s, prefix);

const SE = require('.');
const se = SE(SE.htmlLogger);

events.forEach(tuple => {
    SE.htmlLogger.emit(tuple[0], tuple[1]);
});
