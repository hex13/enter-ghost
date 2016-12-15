const log_noEffect = (name) => {
    console.warn(`this ${name} call had no effect`);
};

export const goTo = (file, pos) => {
    const masterDoc = file.owner;
    if (masterDoc) 
        masterDoc.emit('goTo', pos);
    else 
        log_noEffect('goTo');

    //TODO maybe it shoud be responsibility of file?
    // doc.file.emit('goTo')
    // then owner of file would be listen to this
}; 