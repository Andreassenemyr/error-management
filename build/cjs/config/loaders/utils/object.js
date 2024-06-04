Object.defineProperty(exports, '__esModule', { value: true });

const objectToString = Object.prototype.toString;

function isBuiltin(wat, className) {
    return objectToString.call(wat) === `[object ${className}]`;
}
function isRegExp(wat) {
    return isBuiltin(wat, 'RegExp');
}

function isString(wat) {
    return isBuiltin(wat, 'String');
}

exports.isRegExp = isRegExp;
exports.isString = isString;
//# sourceMappingURL=object.js.map
