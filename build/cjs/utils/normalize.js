Object.defineProperty(exports, '__esModule', { value: true });

const memo = require('./memo.js');
const object = require('./object.js');

function normalizeToSize(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    object,
    // Default Node.js REPL depth
    depth = 3,
    // 100kB, as 200kB is max payload size, so half sounds reasonable
    maxSize = 100 * 1024,
) {
    const normalized = normalize(object, depth);

    if (jsonSize(normalized) > maxSize) {
      return normalizeToSize(object, depth - 1, maxSize);
    }

    return normalized ;
}

function normalize(input, depth = 100, maxProperties = +Infinity) {
    try {
      // since we're at the outermost level, we don't provide a key
      return visit('', input, depth, maxProperties);
    } catch (err) {
      return { ERROR: `**non-serializable** (${err})` };
    }
}
function visit(
    key,
    value,
    depth = +Infinity,
    maxProperties = +Infinity,
    memo$1 = memo.memoBuilder(),
  ) {
    const [memoize, unmemoize] = memo$1;

    // Get the simple cases out of the way first
    if (
      value == null || // this matches null and undefined -> eqeq not eqeqeq
      (['number', 'boolean', 'string'].includes(typeof value) && !Number.isNaN(value))
    ) {
      return value ;
    }

    const stringified = stringifyValue(key, value);

    // Anything we could potentially dig into more (objects or arrays) will have come back as `"[object XXXX]"`.
    // Everything else will have already been serialized, so if we don't see that pattern, we're done.
    if (!stringified.startsWith('[object ')) {
      return stringified;
    }

    // From here on, we can assert that `value` is either an object or an array.

    // Do not normalize objects that we know have already been normalized. As a general rule, the
    // "__ribban_skip_normalization__" property should only be used sparingly and only should only be set on objects that
    // have already been normalized.
    if ((value )['__ribban_skip_normalization__']) {
      return value ;
    }

    // We can set `__ribban_override_normalization_depth__` on an object to ensure that from there
    // We keep a certain amount of depth.
    // This should be used sparingly, e.g. we use it for the redux integration to ensure we get a certain amount of state.
    const remainingDepth =
      typeof (value )['__ribban_override_normalization_depth__'] === 'number'
        ? ((value )['__ribban_override_normalization_depth__'] )
        : depth;

    // We're also done if we've reached the max depth
    if (remainingDepth === 0) {
      // At this point we know `serialized` is a string of the form `"[object XXXX]"`. Clean it up so it's just `"[XXXX]"`.
      return stringified.replace('object ', '');
    }

    // If we've already visited this branch, bail out, as it's circular reference. If not, note that we're seeing it now.
    if (memoize(value)) {
      return '[Circular ~]';
    }

    // If the value has a `toJSON` method, we call it to extract more information
    const valueWithToJSON = value ;
    if (valueWithToJSON && typeof valueWithToJSON.toJSON === 'function') {
      try {
        const jsonValue = valueWithToJSON.toJSON();
        // We need to normalize the return value of `.toJSON()` in case it has circular references
        return visit('', jsonValue, remainingDepth - 1, maxProperties, memo$1);
      } catch (err) {
        // pass (The built-in `toJSON` failed, but we can still try to do it ourselves)
      }
    }

    // At this point we know we either have an object or an array, we haven't seen it before, and we're going to recurse
    // because we haven't yet reached the max depth. Create an accumulator to hold the results of visiting each
    // property/entry, and keep track of the number of items we add to it.
    const normalized = (Array.isArray(value) ? [] : {}) ;
    let numAdded = 0;

    // Before we begin, convert`Error` and`Event` instances into plain objects, since some of each of their relevant
    // properties are non-enumerable and otherwise would get missed.
    const visitable = object.convertToPlainObject(value );

    for (const visitKey in visitable) {
      // Avoid iterating over fields in the prototype if they've somehow been exposed to enumeration.
      if (!Object.prototype.hasOwnProperty.call(visitable, visitKey)) {
        continue;
      }

      if (numAdded >= maxProperties) {
        normalized[visitKey] = '[MaxProperties ~]';
        break;
      }

      // Recursively visit all the child nodes
      const visitValue = visitable[visitKey];
      normalized[visitKey] = visit(visitKey, visitValue, remainingDepth - 1, maxProperties, memo$1);

      numAdded++;
    }

    // Once we've visited all the branches, remove the parent from memo storage
    unmemoize(value);

    // Return accumulated values
    return normalized;
}

function stringifyValue(
    key,
    // this type is a tiny bit of a cheat, since this function does handle NaN (which is technically a number), but for
    // our internal use, it'll do
    value,
  ) {
    try {
      if (key === 'domain' && value && typeof value === 'object' && (value )._events) {
        return '[Domain]';
      }

      if (key === 'domainEmitter') {
        return '[DomainEmitter]';
      }

      // It's safe to use `global`, `window`, and `document` here in this manner, as we are asserting using `typeof` first
      // which won't throw if they are not present.

      if (typeof global !== 'undefined' && value === global) {
        return '[Global]';
      }

      // eslint-disable-next-line no-restricted-globals
      if (typeof window !== 'undefined' && value === window) {
        return '[Window]';
      }

      // eslint-disable-next-line no-restricted-globals
      if (typeof document !== 'undefined' && value === document) {
        return '[Document]';
      }

      if (typeof value === 'number' && value !== value) {
        return '[NaN]';
      }

      if (typeof value === 'function') {
        return `[Function: ${getFunctionName(value)}]`;
      }

      if (typeof value === 'symbol') {
        return `[${String(value)}]`;
      }

      // stringified BigInts are indistinguishable from regular numbers, so we need to label them to avoid confusion
      if (typeof value === 'bigint') {
        return `[BigInt: ${String(value)}]`;
      }

      // Now that we've knocked out all the special cases and the primitives, all we have left are objects. Simply casting
      // them to strings means that instances of classes which haven't defined their `toStringTag` will just come out as
      // `"[object Object]"`. If we instead look at the constructor's name (which is the same as the name of the class),
      // we can make sure that only plain objects come out that way.
      const objName = getConstructorName(value);

      // Handle HTML Elements
      if (/^HTML(\w*)Element$/.test(objName)) {
        return `[HTMLElement: ${objName}]`;
      }

      return `[object ${objName}]`;
    } catch (err) {
      return `**non-serializable** (${err})`;
    }
}

/** Calculates bytes size of input object */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function jsonSize(value) {
    return utf8Length(JSON.stringify(value));
}

function utf8Length(value) {
    // eslint-disable-next-line no-bitwise
    return ~-encodeURI(value).split(/%..|./).length;
}

function getConstructorName(value) {
    const prototype = Object.getPrototypeOf(value);

    return prototype ? prototype.constructor.name : 'null prototype';
}

function getFunctionName(fn) {
    try {
        if (!fn || typeof fn !== 'function') {
            return defaultFunctionName;
        }
        return fn.name || defaultFunctionName;
    } catch (e) {
        // Just accessing custom props in some Selenium environments
        // can cause a "Permission denied" exception (see raven-js#495).
        return defaultFunctionName;
    }
}

const defaultFunctionName = '<anonymous>';

exports.getFunctionName = getFunctionName;
exports.normalize = normalize;
exports.normalizeToSize = normalizeToSize;
//# sourceMappingURL=normalize.js.map
