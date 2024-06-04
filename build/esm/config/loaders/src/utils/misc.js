import { isString, isRegExp } from './object.js';

function isMatchingPattern(
    value,
    pattern,
    requireExactStringMatch = false,
) {
    if (!isString(value)) {
        return false;
    }

    if (isRegExp(pattern)) {
        return pattern.test(value);
    }

    if (isString(pattern)) {
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

export { isMatchingPattern, stringMatchesSomePattern };
//# sourceMappingURL=misc.js.map
