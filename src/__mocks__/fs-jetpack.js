const cwdStack = [];

const foo = {
    append: jest.fn(),
    copy: jest.fn(),
    createReadStream: jest.fn(),
    createWriteStream: jest.fn(),
    testOnlyGetCwdStack: () => {
        return cwdStack;
    },
    cwd(_dir) {
        cwdStack.push(_dir);
        return foo;
    },
    dir: jest.fn(),
    exists: jest.fn(),
    file: jest.fn(),
    find: jest.fn(),
    inspect: jest.fn(),
    inspectTree: jest.fn(),
    list: jest.fn(),
    move: jest.fn(),
    path() {
        const arg = Array.from(arguments);
        return arg.join('/');
    },
    read: jest.fn(),
    remove: jest.fn(),
    rename: jest.fn(),
    symlink: jest.fn(),
    tmpDir: jest.fn(),
    write: jest.fn()
};

module.exports = foo;

