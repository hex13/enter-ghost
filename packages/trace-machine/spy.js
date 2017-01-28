"use strict";
module.exports = function createTraceMachine({logger /*shouldStoreEvents:bool*/}) {
    // return {
    //   spy, echo, events
    // };

    // maxEventCount
    const maxLevel = 5;

    logger.emit('init');

    return function spy(o, className = '', level = 0) {

        if (level > maxLevel) {
            console.error(`Spy: max level of spying (${maxLevel}) achieved.`)
            return o;
        }

        if (!className && typeof o == 'function') className = o.name;
        return new Proxy(o, {
            apply(target, self, args) {
                logger.emit('call', {
                    name: target.name || className,
                    args,
                    self
                })
                const result = target.apply(self, args);

                logger.emit('ret', {
                    value: result
                })
                return result;
            },
            get(o, name) {
                const value = o[name];

                // to avoid weird effects...
                if (
                    ['valueOf', 'toString', 'bind', 'length', 'name', 'inspect'].includes(name) || typeof name == 'symbol'
                ) {
                    return value;
                }

                if (typeof value === 'function') {
                    if (o.constructor && o.constructor.name == 'Promise')
                        return spy(value, name, level + 1).bind(o);
                    else {
                        return spy(value, name, level + 1);
                    }
                    // return function() {
                    //     const result = value.apply(this, arguments);
                    //     return result;
                    // };
                }

                logger.emit('get', {
                    //obj: o,
                    name,
                    value
                });

                return value;
            },
            set(o, name, value) {
                logger.emit('set', {
                    name,
                    value
                });
                o[name] = value;
                return true;
            },
            construct(o, args) {
                logger.emit('new', {
                    name: className,
                    args,
                });
                return spy(new o(...args), className, level + 1);
            }
        });
    }
};
