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

export { isRegExp, isString };
//# sourceMappingURL=object.js.map
