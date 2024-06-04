import { Extras } from "..";
import { Client, exceptionFromError, parseStackFrames } from "../client";
import { Event, EventHint } from "../types";
import { Mechanism } from "../types/mechanism";
import { StackParser } from "../types/stacktrace"
import { normalizeToSize } from "./normalize";
import { extractExceptionKeysForMessage, isError, isErrorEvent, isPlainObject } from "./object";

function getMessageForObject(exception: Record<string, unknown>): string {
    if ('name' in exception && typeof exception.name === 'string') {
        let message = `'${exception.name}' captured as exception`;

        if ('message' in exception && typeof exception.message === 'string') {
            message += ` with message '${exception.message}'`;
        }

        return message;
    } else if ('message' in exception && typeof exception.message === 'string') {
        return exception.message;
    }

    const keys = extractExceptionKeysForMessage(exception);

    // Some ErrorEvent instances do not have an `error` property, which is why they are not handled before
    // We still want to try to get a decent message for these cases
    if (isErrorEvent(exception)) {
        return `Event \`ErrorEvent\` captured as exception with message \`${exception.message}\``;
    }

    const className = getObjectClassName(exception);

    return `${className && className !== 'Object' ? `'${className}'` : 'Object'
        } captured as exception with keys: ${keys}`;
}


function getObjectClassName(obj: unknown): string | undefined | void {
    try {
        const prototype: unknown | null = Object.getPrototypeOf(obj);
        return prototype ? prototype.constructor.name : undefined;
    } catch (e) {
        // ignore errors here
    }
}

function getErrorPropertyFromObject(obj: Record<string, unknown>): Error | undefined {
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


function getException(
    client: Client,
    mechanism: Mechanism,
    exception: unknown,
    hint?: EventHint,
): [Error, Extras | undefined] {
    if (isError(exception)) {
        return [exception, undefined];
    }

    // Mutate this!
    mechanism.synthetic = true;

    if (isPlainObject(exception)) {
        const normalizeDepth = client && client.getOptions().normalizeDepth;
        const extras = { ['__serialized__']: normalizeToSize(exception as Record<string, unknown>, normalizeDepth) };

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
    const ex = (hint && hint.syntheticException) || new Error(exception as string);
    ex.message = `${exception}`;

    return [ex, undefined];
}

export function eventFromUnknownInput(
    client: Client,
    stackParser: StackParser,
    exception: unknown,
    hint?: EventHint,
): Event {
    const providedMechanism: Mechanism | undefined =
        hint && hint.data && (hint.data as { mechanism: Mechanism }).mechanism;
    const mechanism: Mechanism = providedMechanism || {
        handled: true,
        type: 'generic',
    };

    const [ex, extras] = getException(client, mechanism, exception, hint);

    const event: Event = {
        exception: {
            values: [exceptionFromError(stackParser, ex)],
        },
    };

    if (extras) {
        event.extra = extras;
    }

    addExceptionTypeValue(event, undefined, undefined);
    addExceptionMechanism(event, mechanism);

    return {
        ...event,
        event_id: hint && hint.event_id,
    };
}