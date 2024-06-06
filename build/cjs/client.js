Object.defineProperty(exports, '__esModule', { value: true });

const baseclient = require('./baseclient.js');
const carrier = require('./carrier.js');
const currentScopes = require('./current-scopes.js');
const syncpromise = require('./transport/syncpromise.js');
const normalize = require('./utils/normalize.js');
const object = require('./utils/object.js');
const is = require('./transport/is.js');
const misc = require('./utils/misc.js');

/**
 * User-Facing Ribban SDK Client.
 *
 * This interface contains all methods to interface with the SDK once it has
 * been installed. It allows to send events to Ribban, record breadcrumbs and
 * set a context included in every event. Since the SDK mutates its environment,
 * there will only be one instance during runtime.
 *
 */

class BrowserClient extends baseclient.BaseClient {
     constructor(options) {
        super(options);
    }

    flush(timeout) {
        return super.flush(timeout);
    }

     eventFromException(exception, hint) {
        console.log('Getting Event from Exception.', exception);

        return eventFromException(this.options.stackParser, exception, hint, this.options.attachStacktrace);
    }

     eventFromMessage(message, level, hint) {
        return eventFromMessage(this.options.stackParser, message, level, hint, this.options.attachStacktrace);
    };

     _prepareEvent(event, hint, currentScope) {
        event.platform = event.platform || 'javascript';
        return super._prepareEvent(event, hint, currentScope);
    };
}
function eventFromClientUnknownInput(
    client,
    stackParser,
    exception,
    hint,
) {
    const providedMechanism =
        hint && hint.data && (hint.data ).mechanism;
    const mechanism = providedMechanism || {
        handled: true,
        type: 'generic',
    };

    const [ex, extras] = getException(client, mechanism, exception, hint);

    const event = {
        exception: {
            values: [exceptionFromError(stackParser, ex)],
        },
    };

    if (extras) {
        event.extra = extras;
    }

    misc.addExceptionTypeValue(event, undefined);
    misc.addExceptionMechanism(event, mechanism);

    return {
        ...event,
        event_id: hint && hint.event_id,
    };
}

function eventFromUnknownInput(
    stackParser,
    exception,
    syntheticException,
    attachStacktrace,
    isUnhandledRejection,
) {
    let event;

    console.log('Getting Event from unknown input.', exception);

    if (object.isErrorEvent(exception ) && (exception ).error) {
        const errorEvent = exception ;
        event = eventFromError(stackParser, errorEvent.error );

        console.log('Event from Error Event', event);
    }

    if (object.isDOMError(exception) || object.isDOMException(exception )) {
        const domException = exception ;

        if ('stack' in (exception )) {
            event = eventFromError(stackParser, domException );
        } else {
            const name = domException.name || (object.isDOMError(domException) ? 'DOMError' : 'DOMException');
            const message = domException.message ? `${name}: ${domException.message}` : name;
            event = eventFromString(stackParser, message, syntheticException, attachStacktrace);
            misc.addExceptionTypeValue(event, message);
        }
    }

    if (object.isError(exception)) {
        console.log('Event from Error', exception);

        return eventFromError(stackParser, exception);
    }

    if (object.isPlainObject(exception) || object.isEvent(exception)) {
        const objectException = exception ;
        event = eventFromPlainObject(stackParser, objectException, syntheticException, isUnhandledRejection);
        misc.addExceptionMechanism(event, {
            synthetic: true,
        });

        return event;
    }
    console.log('Event from String', exception);

    event = eventFromString(stackParser, `${exception}`, syntheticException, attachStacktrace);
    misc.addExceptionTypeValue(event, `${exception}`);
    misc.addExceptionMechanism(event, {
        synthetic: true,
    });

    return event;
}

function eventFromString(
    stackParser,
    message,
    syntheticException,
    attachStacktrace,
) {
    const event = {};

    if (attachStacktrace && syntheticException) {
        const frames = parseStackFrames(stackParser, syntheticException);
        if (frames.length) {
            event.exception = {
                values: [{ value: message, stacktrace: { frames } }],
            };
        }
    }

    if (is.isParameterizedString(message)) {
        const { __ribban_template_string__, __ribban_template_values__ } = message;

        event.logentry = {
            message: __ribban_template_string__,
            params: __ribban_template_values__,
        };

        return event;
    }

    event.message = message;
    return event;
}

function eventFromMessage(
    stackParser,
    message,
    level = 'info',
    hint,
    attachStacktrace,
) {
    const syntheticException = (hint && hint.syntheticException) || undefined;

    const event = eventFromString(stackParser, message, syntheticException, attachStacktrace);
    event.level = level;

    if (hint && hint.event_id) {
        event.event_id = hint.event_id;
    }

    return syncpromise.resolvedSyncPromise(event);
}

function eventFromError(stackParser, ex) {
    return {
        exception: {
            values: [exceptionFromError(stackParser, ex)],
        },
    };
}

function eventFromException(
    stackParser,
    exception,
    hint,
    attachStacktrace,
) {
    console.log('Getting Event from Exception.', exception);

    const syntethicException = (hint && hint.syntheticException) || undefined;
    const event = eventFromUnknownInput(stackParser, exception, syntethicException, attachStacktrace);

    misc.addExceptionMechanism(event);
    event.level = 'error';

    console.log(event);

    if (hint && hint.event_id) {
        event.event_id = hint.event_id;
    }
    return syncpromise.resolvedSyncPromise(event);
}

function setCurrentClient(client) {
    currentScopes.getCurrentScope().setClient(client);
    registerClientOnGlobalHub(client);
}

function registerClientOnGlobalHub(client) {
    const ribbanGlobal = carrier.getRibbanCarrier(carrier.getMainCarrier()) ;
    if (ribbanGlobal.hub && typeof ribbanGlobal.hub.getStackTop === 'function') {
        ribbanGlobal.hub.getStackTop().client = client;
    }
}

function getException(
    client,
    mechanism,
    exception,
    hint,
) {
    if (object.isError(exception)) {
        return [exception, undefined];
    }

    // Mutate this!
    mechanism.synthetic = true;

    if (object.isPlainObject(exception)) {
        const normalizeDepth = client && client.getOptions().normalizeDepth;
        const extras = { ['__serialized__']: normalize.normalizeToSize(exception , normalizeDepth) };

        const errorFromProp = getErrorPropertyFromObject(exception);
        if (errorFromProp) {
            return [errorFromProp, extras];
        }

        const message = getMessageForObject(exception);
        const ex = (hint && hint.syntheticException) || new Error(message);
        ex.message = message;

        return [ex, extras];
    }

    // This handles when someone does: `throw "something awesome";`
    // We use synthesized Error here so we can extract a (rough) stack trace.
    const ex = (hint && hint.syntheticException) || new Error(exception );
    ex.message = `${exception}`;

    return [ex, undefined];
}

function getMessageForObject(exception) {
    if ('name' in exception && typeof exception.name === 'string') {
        let message = `'${exception.name}' captured as exception`;

        if ('message' in exception && typeof exception.message === 'string') {
            message += ` with message '${exception.message}'`;
        }

        return message;
    } else if ('message' in exception && typeof exception.message === 'string') {
        return exception.message;
    }

    const keys = object.extractExceptionKeysForMessage(exception);

    // Some ErrorEvent instances do not have an `error` property, which is why they are not handled before
    // We still want to try to get a decent message for these cases
    if (object.isErrorEvent(exception)) {
        return `Event \`ErrorEvent\` captured as exception with message \`${exception.message}\``;
    }

    const className = getObjectClassName(exception);

    return `${className && className !== 'Object' ? `'${className}'` : 'Object'} captured as exception with keys: ${keys}`;
}

function eventFromPlainObject(
    stackParser,
    exception,
    syntheticException,
    isUnhandledRejection,
) {
    const client = currentScopes.getClient();
    const normalizeDepth = client && client.getOptions().normalizeDepth;

    // If we can, we extract an exception from the object properties
    const errorFromProp = getErrorPropertyFromObject(exception);

    const extra = {
        __serialized__: normalize.normalizeToSize(exception, normalizeDepth),
    };

    if (errorFromProp) {
        return {
            exception: {
                values: [exceptionFromError(stackParser, errorFromProp)],
            },
            extra,
        };
    }

    const event = {
        exception: {
            values: [
                {
                    type: object.isEvent(exception) ? exception.constructor.name : isUnhandledRejection ? 'UnhandledRejection' : 'Error',
                    value: getNonErrorObjectExceptionValue(exception, { isUnhandledRejection }),
                } ,
            ],
        },
        extra,
    } ;

    if (syntheticException) {
        const frames = parseStackFrames(stackParser, syntheticException);
        if (frames.length) {
            // event.exception.values[0] has been set above
            event.exception.values[0].stacktrace = { frames };
        }
    }

    return event;
}

function getObjectClassName(obj) {
    try {
        const prototype = Object.getPrototypeOf(obj);
        return prototype ? prototype.constructor.name : undefined;
    } catch (e) {
        // ignore errors here
    }
}

function exceptionFromError(stackParser, error) {
    const exception = {
        type: error.name || error.constructor.name,
        value: error.message,
    };

    console.log(exception);

    const frames = parseStackFrames(stackParser, error);
    if (frames.length) {
        exception.stacktrace = { frames };
    }

    return exception;
}

function parseStackFrames(stackParser, error) {
    return stackParser(error.stack || '', 1);
}

function getErrorPropertyFromObject(obj) {
    for (const prop in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, prop)) {
            const value = obj[prop];
            if (value instanceof Error) {
                return value;
            }
        }
    }

    return undefined;
}

function getNonErrorObjectExceptionValue(
    exception,
    { isUnhandledRejection },
) {
    const keys = object.extractExceptionKeysForMessage(exception);
    const captureType = isUnhandledRejection ? 'promise rejection' : 'exception';

    // Some ErrorEvent instances do not have an `error` property, which is why they are not handled before
    // We still want to try to get a decent message for these cases
    if (object.isErrorEvent(exception)) {
        return `Event \`ErrorEvent\` captured as ${captureType} with message \`${exception.message}\``;
    }

    if (object.isEvent(exception)) {
        const className = getObjectClassName(exception);
        return `Event \`${className}\` (type=${exception.type}) captured as ${captureType}`;
    }

    return `Object captured as ${captureType} with keys: ${keys}`;
}

exports.BrowserClient = BrowserClient;
exports.eventFromClientUnknownInput = eventFromClientUnknownInput;
exports.eventFromException = eventFromException;
exports.eventFromMessage = eventFromMessage;
exports.eventFromUnknownInput = eventFromUnknownInput;
exports.exceptionFromError = exceptionFromError;
exports.parseStackFrames = parseStackFrames;
exports.setCurrentClient = setCurrentClient;
//# sourceMappingURL=client.js.map
