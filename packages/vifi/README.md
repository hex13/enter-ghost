examples:
```javascript
const vifi = require('vifi');

const file = vifi.open('example.json');

file.read().then(contents => {
    console.log("THIS IS TEXT CONTENTS", contents);
});


file.parse().then(obj => {
    console.log("THIS IS PARSED OBJECT", obj);
    console.log("LET'S CHANGE IT!");
    obj.city = 'London';
    file.stringify().then(()=>file.flush());     
});


```

