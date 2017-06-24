exports.wrapClass = function wrapClass(Class) {
    Object.getOwnPropertyNames(Class.prototype).forEach(prop => {
        const originalMethod = Class.prototype[prop];
        Class.prototype[prop] = function (...args) {
            console.log(`${Class.name}::${prop}`, args)
            const result = originalMethod.apply(this, args);
            console.log('=>', result)
            return result;
        }
    });
};
