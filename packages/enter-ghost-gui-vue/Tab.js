module.exports = {
    name: 'tabik',
    props: ['doc'],
    template: `<button style="
        border: none;
        background: none;
        font-size: 14px;
        color: inherit;
        height:100%;display:inline-block">{{doc.file.basename()}}</button>`
};
