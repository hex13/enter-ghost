exports.createIpc = (process, receive) => {
    const requests = new Map;

    process.on('message', (d) => {
        if (d && d.type == 'response') {
            const resolve = requests.get(d.id);
            if (resolve) {
                resolve(d.value);
                requests.delete(d);
            }
        }
        if (d && d.type == 'request') {
            receive(d);
        }
     });


    process.stderr.on('data', (d) => {
        console.log(d+'')
    });

    return {
        dispatch(msg) {
            if (msg.type == 'request') {
                return this.request(msg.name, ...msg.args)
            }
        },
        request(name, ...args) {
            return new Promise(resolve => {
                const id = Math.random().toString();
                requests.set(id,resolve);

                process.send({
                    id,
                    type: 'request',
                    name,
                    args
                });
            });
        }
    };
};
