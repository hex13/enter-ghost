'use strict';
// experimental API

const { Stream } = require('./stream');
const { AUTO } = require('transmutable/symbols');

const Hub = (store) => {
    const input = Stream();
    return {
        input,
        addService(service) {
            service(input).subscribe((transform) => {
                store.run(transform)
            });
        }
    }
}

exports.Hub = Hub;

const next = (d, prop) => {
    d[AUTO][prop].idx++;
};

exports.next = next;
