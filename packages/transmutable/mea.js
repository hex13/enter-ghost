'use strict';
// experimental API

const { Stream } = require('./stream');

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
