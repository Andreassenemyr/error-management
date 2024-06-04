import { dsnToString } from './dsn.js';
import { dropUndefinedKeys } from './utils/object.js';
import { GLOBAL_OBJ } from './worldwide.js';

function createEnvelope(headers, items = []) {
    return [headers, items] ;
}

/**
 * Encode a string to UTF8 array.
 */
function encodeUTF8(input) {
    return GLOBAL_OBJ.__RIBBAN__ && GLOBAL_OBJ.__RIBBAN__.encodePolyfill
        ? GLOBAL_OBJ.__RIBBAN__.encodePolyfill(input)
        : new TextEncoder().encode(input);
}

function serializeEnvelope(envelope) {
    const [envHeaders, items] = envelope;

    // Initially we construct our envelope as a string and only convert to binary chunks if we encounter binary data
    let parts = JSON.stringify(envHeaders);

    function append(next) {
        if (typeof parts === 'string') {
            parts = typeof next === 'string' ? parts + next : [encodeUTF8(parts), next];
        } else {
            parts.push(typeof next === 'string' ? encodeUTF8(next) : next);
        }
    }

    for (const item of items) {
        const [itemHeaders, payload] = item;

        append(`\n${JSON.stringify(itemHeaders)}\n`);

        if (typeof payload === 'string' || payload instanceof Uint8Array) {
            append(payload);
        } else {
            let stringifiedPayload;
            try {
                stringifiedPayload = JSON.stringify(payload);
            } catch (e) {
                // In case, despite all our efforts to keep `payload` circular-dependency-free, `JSON.strinify()` still
                // fails, we try again after normalizing it again with infinite normalization depth. This of course has a
                // performance impact but in this case a performance hit is better than throwing.
                stringifiedPayload = JSON.stringify(payload);
            }
            append(stringifiedPayload);
        }
    }

    return typeof parts === 'string' ? parts : concatBuffers(parts);
}

function concatBuffers(buffers) {
    const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);

    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const buffer of buffers) {
        merged.set(buffer, offset);
        offset += buffer.length;
    }

    return merged;
}

function createEventEnvelope(
    event,
    dsn,
    tunnel,
) {
    /*
      Note: Due to TS, event.type may be `replay_event`, theoretically.
      In practice, we never call `createEventEnvelope` with `replay_event` type,
      and we'd have to adjut a looot of types to make this work properly.
      We want to avoid casting this around, as that could lead to bugs (e.g. when we add another type)
      So the safe choice is to really guard against the replay_event type here.
    */
    const eventType = event.type && event.type !== 'replay_event' ? event.type : 'event';

    const envelopeHeaders = createEventEnvelopeHeaders(event, tunnel, dsn);

    // Prevent this data (which, if it exists, was used in earlier steps in the processing pipeline) from being sent to
    // Ribban. (Note: Our use of this property comes and goes with whatever we might be debugging, whatever hacks we may
    // have temporarily added, etc. Even if we don't happen to be using it at some point in the future, let's not get rid
    // of this `delete`, lest we miss putting it back in the next time the property is in use.)
    delete event.sdkProcessingMetadata;

    const eventItem = [{ type: eventType }, event];
    return createEnvelope(envelopeHeaders, [eventItem]);
}

function createSessionEnvelope(
    session,
    dsn,
    tunnel,
) {
    const envelopeHeaders = {
        sent_at: new Date().toISOString(),
        ...(!!tunnel && dsn && { dsn: dsnToString(dsn) }),
    };

    const envelopeItem =
        'aggregates' in session ? [{ type: 'sessions' }, session] : [{ type: 'session' }, session.toJSON()];

    return createEnvelope(envelopeHeaders, [envelopeItem]);
}

function createEventEnvelopeHeaders(
    event,
    tunnel,
    dsn,
) {
    const dynamicSamplingContext = event.sdkProcessingMetadata && event.sdkProcessingMetadata.dynamicSamplingContext;
    return {
        event_id: event.event_id ,
        sent_at: new Date().toISOString(),
        ...(!!tunnel && dsn && { dsn: dsnToString(dsn) }),
        ...(dynamicSamplingContext && {
            trace: dropUndefinedKeys({ ...dynamicSamplingContext }),
        }),
    };
}

export { createEnvelope, createEventEnvelope, createEventEnvelopeHeaders, createSessionEnvelope, serializeEnvelope };
//# sourceMappingURL=envelope.js.map
