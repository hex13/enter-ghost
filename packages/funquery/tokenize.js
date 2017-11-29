const STATE_DEFAULT = 'default';
const STATE_STRING = 'string';
function tokenize(query) {
    const re =  /(\w+)|\\"|{}|->|[|!@#$%^&*()\[\]:;/"'\`~{}<>,.?=-]/g;
    const tokens = [];
    let match;
    let state = STATE_DEFAULT;
    let s;
    let startIndex;
    let tokenKind;
    while (match = re.exec(query)) {
        const ch = match[0];


        if (ch == '"') {
            if (state != STATE_STRING) {
                startIndex = match.index + 1;
                state = STATE_STRING;
            } else {
                const token = {
                    kind: 'string',
                    text: query.slice(startIndex, match.index).replace(/\\"/g, '"')
                };
                tokens.push(token);
                state = STATE_DEFAULT;
                continue;
            }
        }

        switch (state) {
            case STATE_DEFAULT:
                tokens.push(ch);
                break;
        }
        if (state =='s') {

        }

    }

    return tokens;
}

module.exports = tokenize;

//console.log(tokenize(process.argv[2]))
