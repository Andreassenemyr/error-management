import { Primitive } from "../scope";
import { PolymorphicEvent } from "../types/polymorhics";
import { htmlTreeAsString } from "./browser";
import { logger } from "./logger";

export function dropUndefinedKeys<T>(inputValue: T): T {
    const memoizationMap = new Map<unknown, unknown>();

    return dropUndefinedKeysInner(inputValue, memoizationMap);
};

function dropUndefinedKeysInner<T>(inputValue: T, memoizationMap: Map<unknown, unknown>): T {
    if (isRecord(inputValue)) {
        const memoValue = memoizationMap.get(inputValue);
        if (memoValue !== undefined) {
            return memoValue as T;
        };
        
        const returnValue: { [key: string]: unknown } = {};
        memoizationMap.set(inputValue, returnValue);

        for (const key of Object.keys(inputValue)) {
            if (typeof inputValue[key] !== undefined) {
                returnValue[key] = dropUndefinedKeysInner(inputValue[key], memoizationMap);
            }
        }

        return returnValue as T;
    }

    if (Array.isArray(inputValue)) {
        const memoValue = memoizationMap.get(inputValue);
        if (memoValue !== undefined) {
            return memoValue as T;
        };

        const returnValue: unknown[] = [];
        memoizationMap.set(inputValue, returnValue);

        inputValue.forEach((item: unknown) => {
            returnValue.push(dropUndefinedKeysInner(item, memoizationMap)); 
        })

        return returnValue as unknown as T;
    };

    return inputValue;
};

export function isDOMException(wat: unknown): boolean {
    return isBuiltin(wat, 'DOMException');
}

export function isDOMError(wat: unknown): boolean {
    return isBuiltin(wat, 'DOMError');
}

function isRecord(input: unknown): input is Record<string, unknown> {
    if (!isPlainObject(input)) {
        return false;
    }
  
    try {
        const name = (Object.getPrototypeOf(input) as { constructor: { name: string } }).constructor.name;
        return !name || name === 'Object';
    } catch {
        return true;
    }
};

const objectToString = Object.prototype.toString;

function isBuiltin(wat: unknown, className: string): boolean {
    return objectToString.call(wat) === `[object ${className}]`;
};
  

export function isPlainObject(wat: unknown): wat is Record<string, unknown> {
    return isBuiltin(wat, 'Object');
};

export function addNonEnumerableProperty(obj: object, name: string, value: unknown): void {
    try {
        Object.defineProperty(obj, name, {
            // enumerable: false, // the default, so we can save on bundle size by not explicitly setting it
            value: value,
            writable: true,
            configurable: true,
        });
    } catch (o_O) {
        logger.log(`Failed to add non-enumerable property "${name}" to object`, obj);
    }
}

export function isPrimitive(wat: unknown): wat is Primitive {
    return wat === null || (typeof wat !== 'object' && typeof wat !== 'function');
}

export function isError(wat: unknown): wat is Error {
    switch (objectToString.call(wat)) {
        case '[object Error]':
        case '[object Exception]':
        case '[object DOMException]':
            return true;
        default:
            return isInstanceOf(wat, Error);
    }
}

export function isInstanceOf(wat: any, base: any): boolean {
    try {
        return wat instanceof base;
    } catch (_e) {
        return false;
    }
}
  

export function extractExceptionKeysForMessage(exception: Record<string, unknown>, maxLength: number = 40): string {
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

export function convertToPlainObject<V>(value: V):
    | {
        [ownProps: string]: unknown;
        type: string;
        target: string;
        currentTarget: string;
        detail?: unknown;
      }
    | {
        [ownProps: string]: unknown;
        message: string;
        name: string;
        stack?: string;
      }
    | V {
    if (isError(value)) {
        return {
            message: value.message,
            name: value.name,
            stack: value.stack,
            ...getOwnProperties(value),
        };
    } else if (isEvent(value)) {
        const newObj: {
          [ownProps: string]: unknown;
          type: string;
          target: string;
          currentTarget: string;
          detail?: unknown;
        } = {
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

function getOwnProperties(obj: unknown): { [key: string]: unknown } {
    if (typeof obj === 'object' && obj !== null) {
        const extractedProps: { [key: string]: unknown } = {};
        for (const property in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, property)) {
                extractedProps[property] = (obj as Record<string, unknown>)[property];
            }
        }
        return extractedProps;
    } else {
        return {};
    }
}

function serializeEventTarget(target: unknown): string {
    try {
        return isElement(target) ? htmlTreeAsString(target) : Object.prototype.toString.call(target);
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
export function isElement(wat: unknown): boolean {
    return typeof Element !== 'undefined' && isInstanceOf(wat, Element);
}
  


/**
 * Checks whether given value's type is ErrorEvent
 * {@link isErrorEvent}.
 *
 * @param wat A value to be checked.
 * @returns A boolean representing the result.
 */
export function isErrorEvent(wat: unknown): boolean {
    return isBuiltin(wat, 'ErrorEvent');
}  

export function isString(wat: unknown): wat is string {
    return isBuiltin(wat, 'String');
}

export function isEvent(wat: unknown): wat is PolymorphicEvent {
    return typeof Event !== 'undefined' && isInstanceOf(wat, Event);
}

  
