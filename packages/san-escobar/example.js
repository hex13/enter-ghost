const { echo, spy } = require('.');

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
