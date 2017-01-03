//const dbg = require('../enter-ghost-debug')
const DEBUG_MODULE_PATH = 'enter-ghost-debug';
//dbg.filter('foo')


const utils = require('lupa/plugins/utils');

const createCall = (t, path, args) => {
    const _path = path.slice(0);
    const f = (path) => {
        const last = path.pop();

        if (!path.length) {
            return t.identifier(last);
        }
        return t.MemberExpression(
            f(path),
            t.identifier(last)
        );
    }

    return t.callExpression(
        f(_path),
        args || []
    );
};


module.exports = ({types}) => {
    const t = types;
    return {
        visitor: {
            Program(path) {

                path.node.body.unshift(
                    t.assignmentExpression(
                        '=',
                        t.memberExpression(t.identifier('console'), t.identifier('log')),
                        t.functionExpression(null, [t.identifier('args')], t.blockStatement([]))
                    )
                );
                path.node.body.unshift(
                    t.variableDeclaration(
                        'const', [
                            t.variableDeclarator(
                                t.identifier('dbg'),
                                t.callExpression(t.identifier('require'), [t.stringLiteral(DEBUG_MODULE_PATH)])
                            )
                        ]
                    )
                );
            },
            Function(path) {
                const { node } = path;
                const name = utils.getName(node) || utils.getName(path.parent);
                const args = node.params;
                if (node.body.body) {
                    node.body.body.unshift(
                        t.expressionStatement(
                            createCall(t, ['dbg','func'], [t.stringLiteral(name), ...args])
                        )
                    );
                    node.body.body.push(
                        createCall(t, ['dbg','ret'], [])
                    );
                }
                //path.node.body.unshift(t.identifier('a'));
            },
            ReturnStatement(path) {
                //dbg.log('ret', path.node);

                path.node.argument = createCall(t, ['dbg','ret'], [path.node.argument]);
                // path.node.argument = t.callExpression(t.memberExpression(
                //     t.memberExpression(t.identifier('global'), t.identifier('dbg')),
                //     t.identifier('ret')
                // )

                // path.replaceWith(path.node.argument,
                //     t.identifier('a')
                // );
            }
        }
    }
}
