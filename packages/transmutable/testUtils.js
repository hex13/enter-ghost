exports.createExample = () => ({
    a: 2,
    b: 3,
    c: {
        d: 100
    },
    arr: [1, 2, 3],
    still: {

    },
    mutated: {
        something: 123
    },
    nullable: {
      value: null
    },
    deep: {
        arr: [1, 2, 4, 8, 16]
    },
    observable: {
        foo: {
            cat: {},
            dog: {},
        }
    },
    todos: [
        {text: 'something'}, {user: {name: 'cat'} }
    ],
    some: {
        deep: {
            object: {
                l1: 'Leia',
                l2: 'Luke'
            }
        }
    }
});
