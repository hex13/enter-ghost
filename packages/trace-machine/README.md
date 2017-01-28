# Trace Machine tracks JS objects in real time and emit events through emitter

Usage:

```javascript

const createSpy = require('trace-machine');
const logger = new EventEmitter;
const spy = createSpy({logger});

spy({a: 123}).a; // emitted event 'get'

```

available events: 'get', 'set', 'call', 'ret', 'new'
