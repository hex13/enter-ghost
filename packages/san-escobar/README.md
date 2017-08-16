# dynamic code analysis with pretty visualisation


It allows for spying JS object (via ES6 Proxies) and intercepts what is happening in given object (e.g. function calls). It output traces to the standard output in nice HTML format.

It was written as a proof of concept, but if you're interested (and have some feature request) you can create an issue here:
https://github.com/hex13/enter-ghost/issues/new

![screenshot](https://raw.githubusercontent.com/hex13/enter-ghost/master/packages/san-escobar/san-escobar.gif)

### Usage:

It works best when calling from NodeJS.

Just redirect process output to *.html file:

```
node example.js > output.html
```
 and open it in a browser as interactive visualisation:


#### code example:
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
