
process.send({
    type: 'request',
    name: 'foo',
    args: [1, 2]
});


process.on('message', (d) => {
    console.error('aa',d)
    process.send({
        id: d.id,
        type: 'response',
        value: d.args[0] + d.args[1],
    })
})
