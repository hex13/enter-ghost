#powerful HTML logging for NodeJS applications


These docs are outdated.
========================

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

That's what this library is supposed to do. It provides comfortable `echo` notation instead of plain console.log:

Examples:

```javascript
const { echo, spy } = require('sanescobar');

const name = "John";

// notice lack of parentheses and backticks instead of quotes.
// It uses ES6 tagged templates notation.
echo `Hello ${name}`;

// namesspaces (each namespace automatically gets its own color)
echo.as.Alice `hey! I am Alice!`;
echo.as.Bob `hey! I am a Bob`;
echo.as.Alice `nice to meet you!`;
echo.as.Bob `nice to meet you too!`;


class Calculator {
    fact(n) {
        return n == 1? 1 : this.fact(n - 1) * n;
    }
}
const calculator = spy(new Calculator);

calculator.fact(7); // check HTML output of this!

echo.safe `<div>this is going to be escaped </div>`;
```
