module.exports = {
    Program: {
        enter(node, state) {
            state.analysis.educationalInfos = [];

        }
    },
    IfStatement: {
        enter(node, state) {
            const infos = state.analysis.educationalInfos;
            //const testText = node.test.loc
            infos.push({
                loc: node.test.loc,
                type: 'if-test',
                text: 'condition for if statement'
            });
            infos.push({
                loc: node.consequent.loc,
                type: 'if-consequent',
                testLoc: node.test.loc,
            });
        }
    },
    ForStatement: {
        enter(node, state) {
            const infos = state.analysis.educationalInfos;
            infos.push({
                type: 'for-init',
                loc: node.init.loc,
                text: 'this will initialize loop variables',
            });
            infos.push({
                type: 'for-test',
                loc: node.test.loc,
                text: 'loop will continue to run under this condition.',
            });
            infos.push({
                type: 'for-update',
                loc: node.update.loc,
                text: 'this will run after each cycle',
            });


        },
        exit(node, state) {

        },
    }
};
