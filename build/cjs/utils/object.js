Object.defineProperty(exports, '__esModule', { value: true });

const browser = require('./browser.js');
const logger = require('./logger.js');

function dropUndefinedKeys(inputValue) {
    const memoizationMap = new Map();

    return dropUndefinedKeysInner(inputValue, memoizationMap);
}
function dropUndefinedKeysInner(inputValue, memoizationMap) {
    if (isRecord(inputValue)) {
        const memoValue = memoizationMap.get(inputValue);
        if (memoValue !== undefined) {
            return memoValue ;
        }
        const returnValue = {};
        memoizationMap.set(inputValue, returnValue);

        for (const key of Object.keys(inputValue)) {
            if (typeof inputValue[key] !== undefined) {
                returnValue[key] = dropUndefinedKeysInner(inputValue[key], memoizationMap);
            }
        }

        return returnValue ;
    }

    if (Array.isArray(inputValue)) {
        const memoValue = memoizationMap.get(inputValue);
        if (memoValue !== undefined) {
            return memoValue ;
        }
        const returnValue = [];
        memoizationMap.set(inputValue, returnValue);

        inputValue.forEach((item) => {
            returnValue.push(dropUndefinedKeysInner(item, memoizationMap));
        });

        return returnValue ;
    }
    return inputValue;
}
function isDOMException(wat) {
    return isBuiltin(wat, 'DOMException');
}

function isDOMError(wat) {
    return isBuiltin(wat, 'DOMError');
}

function isRecord(input) {
    if (!isPlainObject(input)) {
        return false;
    }

    try {
        const name = (Object.getPrototypeOf(input) ).constructor.name;
        return !name || name === 'Object';
    } catch (e) {
        return true;
    }
}
const objectToString = Object.prototype.toString;

function isBuiltin(wat, className) {
    return objectToString.call(wat) === `[object ${className}]`;
}
function isPlainObject(wat) {
    return isBuiltin(wat, 'Object');
}
function addNonEnumerableProperty(obj, name, value) {
    try {
        Object.defineProperty(obj, name, {
            // enumerable: false, // the default, so we can save on bundle size by not explicitly setting it
            value: value,
            writable: true,
            configurable: true,
        });
    } catch (o_O) {
        logger.logger.log(`Failed to add non-enumerable property "${name}" to object`, obj);
    }
}

function isPrimitive(wat) {
    return wat === null || (typeof wat !== 'object' && typeof wat !== 'function');
}

function isError(wat) {
    switch (objectToString.call(wat)) {
        case '[object Error]':
        case '[object Exception]':
        case '[object DOMException]':
            return true;
        default:
            return isInstanceOf(wat, Error);
    }
}

function isInstanceOf(wat, base) {
    try {
        return wat instanceof base;
    } catch (_e) {
        return false;
    }
}

function extractExceptionKeysForMessage(exception, maxLength = 40) {
    const keys = Object.keys(convertToPlainObject(exception));
    keys.sort();

    if (!keys.length) {
        return '[object has no keys]';
    }

    if (keys[0].length >= maxLength) {
        return keys[0].substring(0, maxLength);
    }

    for (let includedKeys = keys.length; includedKeys > 0; includedKeys--) {
        const serialized = keys.slice(0, includedKeys).join(', ');
        if (serialized.length > maxLength) {
            continue;
        }
        if (includedKeys === keys.length) {
            return serialized;
        }
        return serialized.substring(0, maxLength);
    }

    return '';
}

function convertToPlainObject(value)

 {
    if (isError(value)) {
        return {
            message: value.message,
            name: value.name,
            stack: value.stack,
            ...getOwnProperties(value),
        };
    } else if (isEvent(value)) {
        const newObj

 = {
          type: value.type,
          target: serializeEventTarget(value.target),
          currentTarget: serializeEventTarget(value.currentTarget),
          ...getOwnProperties(value),
        };

        if (typeof CustomEvent !== 'undefined' && isInstanceOf(value, CustomEvent)) {
          newObj.detail = value.detail;
        }

        return newObj;
    } else {
      return value;
    }
}

function getOwnProperties(obj) {
    if (typeof obj === 'object' && obj !== null) {
        const extractedProps = {};
        for (const property in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, property)) {
                extractedProps[property] = (obj )[property];
            }
        }
        return extractedProps;
    } else {
        return {};
    }
}

function serializeEventTarget(target) {
    try {
        return isElement(target) ? browser.htmlTreeAsString(target) : Object.prototype.toString.call(target);
    } catch (_oO) {
        return '<unknown>';
    }
}

/**
 * Checks whether given value's type is an Element instance
 * {@link isElement}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
function isElement(wat) {
    return typeof Element !== 'undefined' && isInstanceOf(wat, Element);
}

/**
 * Checks whether given value's type is ErrorEvent
 * {@link isErrorEvent}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
function isErrorEvent(wat) {
    return isBuiltin(wat, 'ErrorEvent');
}

function isString(wat) {
    return isBuiltin(wat, 'String');
}

function isEvent(wat) {
    return typeof Event !== 'undefined' && isInstanceOf(wat, Event);
}

exports.addNonEnumerableProperty = addNonEnumerableProperty;
exports.convertToPlainObject = convertToPlainObject;
exports.dropUndefinedKeys = dropUndefinedKeys;
exports.extractExceptionKeysForMessage = extractExceptionKeysForMessage;
exports.isDOMError = isDOMError;
exports.isDOMException = isDOMException;
exports.isElement = isElement;
exports.isError = isError;
exports.isErrorEvent = isErrorEvent;
exports.isEvent = isEvent;
exports.isInstanceOf = isInstanceOf;
exports.isPlainObject = isPlainObject;
exports.isPrimitive = isPrimitive;
exports.isString = isString;
//# sourceMappingURL=object.js.map
