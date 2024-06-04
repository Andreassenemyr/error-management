import { logger } from './logger.js';
import { addNonEnumerableProperty } from './object.js';

function checkOrSetAlreadyCaught(exception) {
    if (exception && (exception ).__ribban_captured__) {
        return true;
    }
    try {
        addNonEnumerableProperty(exception , '__ribban_captured__', true);
    } catch (error) {

    }
    return false;
}

function parseSampleRate(sampleRate) {
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

function addExceptionTypeValue(event, value, type) {
    const exception = (event.exception = event.exception || {});
    const values = (exception.values = exception.values || []);
    const firstException = (values[0] = values[0] || {});
    if (!firstException.value) {
        firstException.value = value || '';
    }
    if (!firstException.type) {
        firstException.type = 'Error';
    }
}

function getFirstException(event) {
    return event.exception && event.exception.values ? event.exception.values[0] : undefined;
}

function addExceptionMechanism(event, newMechanism) {
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

export { addExceptionMechanism, addExceptionTypeValue, checkOrSetAlreadyCaught, parseSampleRate };
//# sourceMappingURL=misc.js.map
