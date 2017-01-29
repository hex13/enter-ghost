# powerful HTML logging for NodeJS applications


Debugging NodeJS code doesn't have to be boring. You aren't limited to dull terminal emulator. The idea is very simple: to log HTML instead of plain text and dump output to the HTML file.
https://twitter.com/hex13code/status/780018739391631360

the simplest yet naïve form of such debugging is putting HTML tags into console.logs:

```javascript
console.log("<ul>");
someArray.forEach(item => {
    console.log('<li style="color:red">', item.value, "</li>");
});
console.log("</li>");
```

but it demands too much boilerplate and is prone to errors.

But if we only we had tool which automagically output nice formatted logs!

That's what this library is supposed to do.

- It formats logs into HTML format. You can redirect process output to *.html file and open it in a browser as interactive visualisation.
- It allows for create spies on objects and functions (it uses trace-machine library under hood). ![screenshot](https://raw.githubusercontent.com/hex13/enter-ghost/master/packages/san-escobar/san-escobar.gif)

Example of use:

```javascript
const SE = require('san-escobar');
const { log, spy } = SE(SE.htmlLogger);

// first create some objects to log...

const pizza = {
    eat() {},
    bake() {},
    buy() {},
    name: "Super Pizza",
    id: 120,
    specification: {
        tomatos: true,
        strawberries: false,
        cheese: true,
        oregano: true,
    },
    price: 4.3,
    url: 'https://example.com/pizza/id=120',
};
pizza.specification.pizza = pizza;
const moon = {
    craters: {
        amount: 'many',
    },
    water: null,
};

// then...

log('This is Pizza', pizza); // it's like console.log but outputs in different way (e.g. in HTML format)

log('This is Moon', moon);

// create spy
const proxied = spy({
    fact(n) {
        if (n == 1) return n;
        return n * this.fact(n - 1);
    }
});

proxied.fact(7);

```

Then run:
```
node example.js > output.html
```
and open `output.html` file.
