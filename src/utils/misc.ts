import { Event } from "../types";
import { Exception } from "../types/exception";
import { Mechanism } from "../types/mechanism";
import { logger } from "./logger";
import { addNonEnumerableProperty, isRegExp, isString } from "./object";

export function checkOrSetAlreadyCaught(exception: unknown) {
    if (exception && (exception as any).__ribban_captured__) {
        return true;
    };

    try {
        addNonEnumerableProperty(exception as { [key: string]: unknown }, '__ribban_captured__', true)
    } catch (error) {

    };

    return false;
}

export function isMatchingPattern(
    value: string,
    pattern: RegExp | string,
    requireExactStringMatch: boolean = false,
): boolean {
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


export function stringMatchesSomePattern(
    testString: string,
    patterns: Array<string | RegExp> = [],
    requireExactStringMatch: boolean = false,
): boolean {
    return patterns.some(pattern => isMatchingPattern(testString, pattern, requireExactStringMatch));
}

export function parseSampleRate(sampleRate: unknown): number | undefined {
    if (typeof sampleRate === 'boolean') {
        return Number(sampleRate);
    }

    const rate = typeof sampleRate === 'string' ? parseFloat(sampleRate) : sampleRate;
    if (typeof rate !== 'number' || isNaN(rate)) {
        logger.warn(
            `[Tracing] Given sample rate is invalid. Sample rate must be a boolean or a number between 0 and 1. Got ${JSON.stringify(
                sampleRate,
            )} of type ${JSON.stringify(typeof sampleRate)}.`,
        );

        return undefined;
    }

    if (rate < 0 || rate > 1) {
        logger.warn(`[Tracing] Given sample rate is invalid. Sample rate must be between 0 and 1. Got ${rate}.`);
        return undefined;
    }

    return rate;
}

export function addExceptionTypeValue(event: Event, value?: string, type?: string): void {
    const exception = (event.exception = event.exception || {});
    const values = (exception.values = exception.values || []);
    const firstException = (values[0] = values[0] || {});
    if (!firstException.value) {
        firstException.value = value || '';
    }
    if (!firstException.type) {
        firstException.type = type || 'Error';
    }
}

function getFirstException(event: Event): Exception | undefined {
    return event.exception && event.exception.values ? event.exception.values[0] : undefined;
}

export function addExceptionMechanism(event: Event, newMechanism?: Partial<Mechanism>): void {
    const firstException = getFirstException(event);
    if (!firstException) {
        return;
    }

    const defaultMechanism = { type: 'generic', handled: true };
    const currentMechanism = firstException.mechanism;
    firstException.mechanism = { ...defaultMechanism, ...currentMechanism, ...newMechanism };

    if (newMechanism && 'data' in newMechanism) {
        const mergedData = { ...(currentMechanism && currentMechanism.data), ...newMechanism.data };
        firstException.mechanism.data = mergedData;
    }
}
