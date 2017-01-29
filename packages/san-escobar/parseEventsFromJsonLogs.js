const util =require('util');
const input = `
["call", {"name": "blah"}]
["red", {"value": 5}]
`;

module.exports = (input) => {
    return input
        .split('\n')
        .map(line => line.trim())
        .filter(line => line) // remove empty lines
        .map(line => JSON.parse(line)); // remove empty lines
}

// t.forEach(line => {
//     console.log("LINE", typeof line, util.inspect(line, {colors: true}));
// });
