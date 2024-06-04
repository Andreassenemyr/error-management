import { Client } from "../../client";
import { getClient } from "../../current-scopes";
import { Span } from "../../node/span/types";
import { DynamicSamplingContext } from "../../types";
import { addNonEnumerableProperty, dropUndefinedKeys } from "../../utils/object";
import { SEMANTIC_ATTRIBUTE_RIBBAN_SAMPLE_RATE, SEMANTIC_ATTRIBUTE_RIBBAN_SOURCE } from "../semanticAttributes";
import { getRootSpan, spanIsSampled, spanToJSON } from "./spanUtilts";

/**
 * If you change this value, also update the terser plugin config to
 * avoid minification of the object property!
 */
const FROZEN_DSC_FIELD = '_frozenDsc';

type SpanWithMaybeDsc = Span & {
    [FROZEN_DSC_FIELD]?: Partial<DynamicSamplingContext> | undefined;
};

/**
 * Freeze the given DSC on the given span.
 */
export function freezeDscOnSpan(span: Span, dsc: Partial<DynamicSamplingContext>): void {
    const spanWithMaybeDsc = span as SpanWithMaybeDsc;
    addNonEnumerableProperty(spanWithMaybeDsc, FROZEN_DSC_FIELD, dsc);
}

/**
 * Creates a dynamic sampling context from a client.
 *
 * Dispatches the `createDsc` lifecycle hook as a side effect.
 */
export function getDynamicSamplingContextFromClient(trace_id: string, client: Client): DynamicSamplingContext {
    const options = client.getOptions();

    const { publicKey: public_key } = client.getDsn() || {};

    const dsc = dropUndefinedKeys({
        environment: options.environment || DEFAULT_ENVIRONMENT,
        public_key,
        trace_id,
    }) as DynamicSamplingContext;

    client.emit('createDsc', dsc);

    return dsc;
}

/**
 * Creates a dynamic sampling context from a span (and client and scope)
 *
 * @param span the span from which a few values like the root span name and sample rate are extracted.
 *
 * @returns a dynamic sampling context
 */
export function getDynamicSamplingContextFromSpan(span: Span): Readonly<Partial<DynamicSamplingContext>> {
    const client = getClient();
    if (!client) {
        return {};
    }

    const dsc = getDynamicSamplingContextFromClient(spanToJSON(span).trace_id || '', client);

    const rootSpan = getRootSpan(span);
    if (!rootSpan) {
        return dsc;
    }

    const frozenDsc = (rootSpan as SpanWithMaybeDsc)[FROZEN_DSC_FIELD];
    if (frozenDsc) {
        return frozenDsc;
    }

    const jsonSpan = spanToJSON(rootSpan);
    const attributes = jsonSpan.data || {};
    const maybeSampleRate = attributes[SEMANTIC_ATTRIBUTE_RIBBAN_SAMPLE_RATE];

    if (maybeSampleRate != null) {
        dsc.sample_rate = `${maybeSampleRate}`;
    }

    // We don't want to have a transaction name in the DSC if the source is "url" because URLs might contain PII
    const source = attributes[SEMANTIC_ATTRIBUTE_RIBBAN_SOURCE];

    // after JSON conversion, txn.name becomes jsonSpan.description
    if (source && source !== 'url') {
        dsc.transaction = jsonSpan.description;
    }

    dsc.sampled = String(spanIsSampled(rootSpan));

    client.emit('createDsc', dsc);

    return dsc;
}

/**
 * Convert a Span to a baggage header.
 */
export function spanToBaggageHeader(span: Span): string | undefined {
    const dsc = getDynamicSamplingContextFromSpan(span);
    return dynamicSamplingContextToSentryBaggageHeader(dsc);
}