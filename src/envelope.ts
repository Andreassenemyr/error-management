import { HostComponent, dsnToString } from "./dsn";
import { Session, SessionAggregates } from "./session";
import { Envelope, EnvelopeItemType, Event, EventEnvelope, EventEnvelopeHeaders, EventItem, SessionEnvelope, SessionItem } from "./types";
import { dropUndefinedKeys } from "./utils/object";
import { GLOBAL_OBJ } from "./worldwide";

export function createEnvelope<E extends Envelope>(headers: E[0], items: E[1] = []): E {
    return [headers, items] as E;
}

/**
 * Encode a string to UTF8 array.
 */
function encodeUTF8(input: string): Uint8Array {
    return GLOBAL_OBJ.__RIBBAN__ && GLOBAL_OBJ.__RIBBAN__.encodePolyfill
        ? GLOBAL_OBJ.__RIBBAN__.encodePolyfill(input)
        : new TextEncoder().encode(input);
}

/**
 * Decode a UTF8 array to string.
 */
function decodeUTF8(input: Uint8Array): string {
    return GLOBAL_OBJ.__RIBBAN__ && GLOBAL_OBJ.__RIBBAN__.decodePolyfill
        ? GLOBAL_OBJ.__RIBBAN__.decodePolyfill(input)
        : new TextDecoder().decode(input);
}

export function serializeEnvelope(envelope: Envelope): string | Uint8Array {
    const [envHeaders, items] = envelope;

    // Initially we construct our envelope as a string and only convert to binary chunks if we encounter binary data
    let parts: string | Uint8Array[] = JSON.stringify(envHeaders);

    function append(next: string | Uint8Array): void {
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
            let stringifiedPayload: string;
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

function concatBuffers(buffers: Uint8Array[]): Uint8Array {
    const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);

    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const buffer of buffers) {
        merged.set(buffer, offset);
        offset += buffer.length;
    }

    return merged;
}


export type DataCategory = 'session' | 'attachment' | 'transaction' | 'error' | 'internal' | 'default' | 'profile' | 'replay' | 'monitor' | 'feedback' | 'metric_bucket' | 'span';

const ITEM_TYPE_TO_DATA_CATEGORY_MAP: Record<EnvelopeItemType, DataCategory> = {
    session: 'session',
    sessions: 'session',
    attachment: 'attachment',
    transaction: 'transaction',
    event: 'error',
    client_report: 'internal',
    user_report: 'default',
    profile: 'profile',
    replay_event: 'replay',
    replay_recording: 'replay',
    check_in: 'monitor',
    feedback: 'feedback',
    span: 'span',
    statsd: 'metric_bucket',
};

/**
 * Maps the type of an envelope item to a data category.
 */
export function envelopeItemTypeToDataCategory(type: EnvelopeItemType): DataCategory {
    return ITEM_TYPE_TO_DATA_CATEGORY_MAP[type];
}

export function createEventEnvelope(
    event: Event,
    dsn?: HostComponent,
    tunnel?: string,
): EventEnvelope {
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

    const eventItem: EventItem = [{ type: eventType }, event];
    return createEnvelope<EventEnvelope>(envelopeHeaders, [eventItem]);
}

export function createSessionEnvelope(
    session: Session | SessionAggregates,
    dsn?: HostComponent,
    tunnel?: string,
): SessionEnvelope {
    const envelopeHeaders = {
        sent_at: new Date().toISOString(),
        ...(!!tunnel && dsn && { dsn: dsnToString(dsn) }),
    };

    const envelopeItem: SessionItem =
        'aggregates' in session ? [{ type: 'sessions' }, session] : [{ type: 'session' }, session.toJSON()];

    return createEnvelope<SessionEnvelope>(envelopeHeaders, [envelopeItem]);
}


export function createEventEnvelopeHeaders(
    event: Event,
    tunnel: string | undefined,
    dsn?: HostComponent,
): EventEnvelopeHeaders {
    const dynamicSamplingContext = event.sdkProcessingMetadata && event.sdkProcessingMetadata.dynamicSamplingContext;
    return {
        event_id: event.event_id as string,
        sent_at: new Date().toISOString(),
        ...(!!tunnel && dsn && { dsn: dsnToString(dsn) }),
        ...(dynamicSamplingContext && {
            trace: dropUndefinedKeys({ ...dynamicSamplingContext }),
        }),
    };
}