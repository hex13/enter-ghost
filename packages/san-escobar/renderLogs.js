const SE = require('.');
const se = SE(SE.htmlLogger);
if (process.argv[2]) {
    const path = process.argv[2];
    const s = require('fs').readFileSync(path, 'utf8');
    const parseEventsFromJsonLogs = require('./parseEventsFromJsonLogs');
    const parsedEvents = parseEventsFromJsonLogs(s, /san escobar:/);
     parsedEvents.forEach(e => {
         SE.htmlLogger.emit(e[0], e[1]);
     });
}
