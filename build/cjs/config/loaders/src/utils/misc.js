Object.defineProperty(exports, '__esModule', { value: true });

const object = require('./object.js');

function isMatchingPattern(
    value,
    pattern,
    requireExactStringMatch = false,
) {
    if (!object.isString(value)) {
        return false;
    }

    if (object.isRegExp(pattern)) {
        return pattern.test(value);
    }

    if (object.isString(pattern)) {
        return requireExactStringMatch ? value === pattern : value.includes(pattern);
    }

    return false;
}

function stringMatchesSomePattern(
    testString,
    patterns = [],
    requireExactStringMatch = false,
) {
    return patterns.some(pattern => isMatchingPattern(testString, pattern, requireExactStringMatch));
}

exports.isMatchingPattern = isMatchingPattern;
exports.stringMatchesSomePattern = stringMatchesSomePattern;
//# sourceMappingURL=misc.js.map
