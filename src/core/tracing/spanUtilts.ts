import { getAsyncContextStrategy } from "../../async-context";
import { getMainCarrier } from "../../carrier";
import { getCurrentScope } from "../../current-scopes";
import { MeasurementUnit } from "../../node/span/measurement";
import { Span, SpanAttributes, SpanJSON, SpanOrigin, SpanTimeInput } from "../../node/span/types";
import { Primitive } from "../../scope";
import { addNonEnumerableProperty, dropUndefinedKeys } from "../../utils/object";
import { SEMANTIC_ATTRIBUTE_RIBBAN_OP, SEMANTIC_ATTRIBUTE_RIBBAN_ORIGIN } from "../semanticAttributes";
import { RibbanSpan } from "./ribbanSpan";
import { _getSpanForScope } from "./spanOnScope";

export const TRACE_FLAG_NONE = 0x0;
export const TRACE_FLAG_SAMPLED = 0x1;

export function spanToTransactionTraceContext(span: Span): TraceContext {
    const { spanId: span_id, traceId: trace_id } = span.spanContext();
    const { data, op, parent_span_id, status, origin } = spanToJSON(span);

    return dropUndefinedKeys({
        parent_span_id,
        span_id,
        trace_id,
        data,
        op,
        status,
        origin,
    });
}

export function spanToTraceContext(span: Span): TraceContext {
    const { spanId: span_id, traceId: trace_id } = span.spanContext();
    const { parent_span_id } = spanToJSON(span);

    return dropUndefinedKeys({ parent_span_id, span_id, trace_id });
}

export function spanTimeInputToSeconds(input: SpanTimeInput | undefined): number {
    if (typeof input === 'number') {
        return ensureTimestampInSeconds(input);
    }

    if (Array.isArray(input)) {
        // See {@link HrTime} for the array-based time format
        return input[0] + input[1] / 1e9;
    }

    if (input instanceof Date) {
        return ensureTimestampInSeconds(input.getTime());
    }

    return timestampInSeconds();
}

function ensureTimestampInSeconds(timestamp: number): number {
    const isMs = timestamp > 9999999999;
    return isMs ? timestamp / 1000 : timestamp;
}

export function spanToJSON(span: Span): Partial<SpanJSON> {
    if (spanIsSentrySpan(span)) {
        return span.getSpanJSON();
    }

    try {
        const { spanId: span_id, traceId: trace_id } = span.spanContext();

        // Handle a span from @opentelemetry/sdk-base-trace's `Span` class
        if (spanIsOpenTelemetrySdkTraceBaseSpan(span)) {
            const { attributes, startTime, name, endTime, parentSpanId, status } = span;

            return dropUndefinedKeys({
                span_id,
                trace_id,
                data: attributes,
                description: name,
                parent_span_id: parentSpanId,
                start_timestamp: spanTimeInputToSeconds(startTime),
                // This is [0,0] by default in OTEL, in which case we want to interpret this as no end time
                timestamp: spanTimeInputToSeconds(endTime) || undefined,
                status: getStatusMessage(status),
                op: attributes[SEMANTIC_ATTRIBUTE_RIBBAN_OP],
                origin: attributes[SEMANTIC_ATTRIBUTE_RIBBAN_ORIGIN] as SpanOrigin | undefined,
                _metrics_summary: getMetricSummaryJsonForSpan(span),
            });
        }

        // Finally, at least we have `spanContext()`....
        return {
            span_id,
            trace_id,
        };
    } catch {
        return {};
    }
}

function spanIsOpenTelemetrySdkTraceBaseSpan(span: Span): span is OpenTelemetrySdkTraceBaseSpan {
    const castSpan = span as OpenTelemetrySdkTraceBaseSpan;
    return !!castSpan.attributes && !!castSpan.startTime && !!castSpan.name && !!castSpan.endTime && !!castSpan.status;
}

export interface OpenTelemetrySdkTraceBaseSpan extends Span {
    attributes: SpanAttributes;
    startTime: SpanTimeInput;
    name: string;
    status: SpanStatus;
    endTime: SpanTimeInput;
    parentSpanId?: string;
}

function spanIsSentrySpan(span: Span): span is RibbanSpan {
    return typeof (span as RibbanSpan).getSpanJSON === 'function';
}

export function spanIsSampled(span: Span): boolean {
    // We align our trace flags with the ones OpenTelemetry use
    // So we also check for sampled the same way they do.
    const { traceFlags } = span.spanContext();
    return traceFlags === TRACE_FLAG_SAMPLED;
}

/** Get the status message to use for a JSON representation of a span. */
export function getStatusMessage(status: SpanStatus | undefined): string | undefined {
    if (!status || status.code === SPAN_STATUS_UNSET) {
        return undefined;
    }

    if (status.code === SPAN_STATUS_OK) {
        return 'ok';
    }

    return status.message || 'unknown_error';
}

const CHILD_SPANS_FIELD = '_sentryChildSpans';
const ROOT_SPAN_FIELD = '_sentryRootSpan';

type SpanWithPotentialChildren = Span & {
    [CHILD_SPANS_FIELD]?: Set<Span>;
    [ROOT_SPAN_FIELD]?: Span;
};

export function addChildSpanToSpan(span: SpanWithPotentialChildren, childSpan: Span): void {
    // We store the root span reference on the child span
    // We need this for `getRootSpan()` to work
    const rootSpan = span[ROOT_SPAN_FIELD] || span;
    addNonEnumerableProperty(childSpan as SpanWithPotentialChildren, ROOT_SPAN_FIELD, rootSpan);

    // We store a list of child spans on the parent span
    // We need this for `getSpanDescendants()` to work
    if (span[CHILD_SPANS_FIELD]) {
        span[CHILD_SPANS_FIELD].add(childSpan);
    } else {
        addNonEnumerableProperty(span, CHILD_SPANS_FIELD, new Set([childSpan]));
    }
}

/** This is only used internally by Idle Spans. */
export function removeChildSpanFromSpan(span: SpanWithPotentialChildren, childSpan: Span): void {
    if (span[CHILD_SPANS_FIELD]) {
        span[CHILD_SPANS_FIELD].delete(childSpan);
    }
}

export function getSpanDescendants(span: SpanWithPotentialChildren): Span[] {
    const resultSet = new Set<Span>();

    function addSpanChildren(span: SpanWithPotentialChildren): void {
        // This exit condition is required to not infinitely loop in case of a circular dependency.
        if (resultSet.has(span)) {
            return;
            // We want to ignore unsampled spans (e.g. non recording spans)
        } else if (spanIsSampled(span)) {
            resultSet.add(span);
            const childSpans = span[CHILD_SPANS_FIELD] ? Array.from(span[CHILD_SPANS_FIELD]) : [];
            for (const childSpan of childSpans) {
                addSpanChildren(childSpan);
            }
        }
    }

    addSpanChildren(span);

    return Array.from(resultSet);
}

/**
 * Returns the root span of a given span.
 */
export function getRootSpan(span: SpanWithPotentialChildren): Span {
    return span[ROOT_SPAN_FIELD] || span;
}

export function getActiveSpan(): Span | undefined {
    const carrier = getMainCarrier();
    const acs = getAsyncContextStrategy(carrier);
    if (acs.getActiveSpan) {
        return acs.getActiveSpan();
    }

    return _getSpanForScope(getCurrentScope());
}

/**
 * Updates the metric summary on the currently active span
 */
export function updateMetricSummaryOnActiveSpan(
    metricType: MetricType,
    sanitizedName: string,
    value: number,
    unit: MeasurementUnit,
    tags: Record<string, Primitive>,
    bucketKey: string,
): void {
    const span = getActiveSpan();
    if (span) {
        updateMetricSummaryOnSpan(span, metricType, sanitizedName, value, unit, tags, bucketKey);
    }
}

