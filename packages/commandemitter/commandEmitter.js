exports.createCommandEmitter = ee => {
    let lastCommand = Promise.resolve();
    return {
        command(type, data) {
            lastCommand = lastCommand.then(() => {
                return new Promise(done => {
                    ee.emit(type, Object.assign({done}, data));
                });
            });
            return lastCommand;
        },
        on(name, handler) {
            ee.on(name, handler);
        }
    };
};
