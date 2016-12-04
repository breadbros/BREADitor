var win;

var set = (w) => {
    win = w;
}

var get = () => {
    return win;
}

export var MainWindow = {
    set: set,
    get: get
};