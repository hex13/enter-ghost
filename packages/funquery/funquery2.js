'use strict';

const tokenize = require('./tokenize');
let c= 0;

const last = arr => arr[arr.length - 1];

const END = Symbol('end');

function parse(query) {
    const tokens = tokenize(query).concat(END);

    const rootBlock = ['block'];
    const commands = [[]];
    const blocks = [rootBlock];

    const beginCommand = (commandName) => {
        const command = commandName? [commandName] : []
        commands.push(command);
        return command;
    }
    const endCommand = () => {
        const command = commands.pop();
        if (command && command.length)
            last(blocks).push(command);
    }

    tokens.forEach(token => {
        switch (token) {
            case '{':
                beginCommand();
                blocks.push(['block']);
                break;
            case '}':
                endCommand();
                last(commands).push(blocks.pop());
                break;
            case ';':
            case '|':
                endCommand();
                beginCommand(token == '|' && 'pipe');
                break;
            case END:
                endCommand();
                break;
            default:
                last(commands).push(token);
        }
    });

    return rootBlock;
}
exports.parse = parse;
