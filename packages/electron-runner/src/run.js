#!/usr/bin/env node
const electron = require('electron');
const cp = require('child_process');
const { join, parse, resolve } = require('path');

const argv = process.argv;
const main = join(__dirname, 'main.js');
const config = join(__dirname, 'config.js');
let rendererScript = '';
if (argv[2]) {
    if (!parse(argv[2]).root) {
        rendererScript = join(resolve('.'), argv[2]);
    } else {
        rendererScript = argv[2];
    }
}
console.log("RRR",rendererScript);

const args = [
    main,
    config,
    rendererScript,
]
cp.spawn(electron, args);
