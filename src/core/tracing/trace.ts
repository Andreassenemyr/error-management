import { Scope } from "../..";
import { AsyncContextStrategy, getAsyncContextStrategy } from "../../async-context";
import { getMainCarrier } from "../../carrier";
import { getClient, getCurrentScope } from "../../current-scopes";
import { RibbanSpanArguments, Span } from "../../node/span/types";
import { ClientOptions } from "../../options";
import { logger } from "../../utils/logger";
import { SEMANTIC_ATTRIBUTE_RIBBAN_SAMPLE_RATE, SEMANTIC_ATTRIBUTE_RIBBAN_SOURCE } from "../semanticAttributes";
import { RibbanSpan } from "./ribbanSpan";
import { _getSpanForScope } from "./spanOnScope";
import { addChildSpanToSpan, getRootSpan } from "./spanUtilts";

const SUPPRESS_TRACING_KEY = '__RIBBAN_SUPPRESS_TRACING__';

export function startInactiveSpan(context: StartSpanOptions): Span {
    const acs = getAcs();
    if (acs.startInactiveSpan) {
        return acs.startInactiveSpan(context);
    }

    const spanContext = normalizeContext(context);

    const scope = context.scope || getCurrentScope();
    const parentSpan = getParentSpan(scope);

    const shouldSkipSpan = context.onlyIfParent && !parentSpan;

    if (shouldSkipSpan) {
        return new SentryNonRecordingSpan();
    }

    return createChildOrRootSpan({
        parentSpan,
        spanContext,
        forceTransaction: context.forceTransaction,
        scope,
    });
}

export const continueTrace = <V>(
    {
        sentryTrace,
        baggage,
    }: {
        sentryTrace: Parameters<typeof propagationContextFromHeaders>[0];
        baggage: Parameters<typeof propagationContextFromHeaders>[1];
    },
    callback: () => V,
): V => {
    return withScope(scope => {
        const propagationContext = propagationContextFromHeaders(sentryTrace, baggage);
        scope.setPropagationContext(propagationContext);
        return callback();
    });
};

export function withActiveSpan<T>(span: Span | null, callback: (scope: Scope) => T): T {
    const acs = getAcs();
    if (acs.withActiveSpan) {
        return acs.withActiveSpan(span, callback);
    }

    return withScope(scope => {
        _setSpanForScope(scope, span || undefined);
        return callback(scope);
    });
}

/** Suppress tracing in the given callback, ensuring no spans are generated inside of it. */
export function suppressTracing<T>(callback: () => T): T {
    const acs = getAcs();

    if (acs.suppressTracing) {
        return acs.suppressTracing(callback);
    }

    return withScope(scope => {
        scope.setSDKProcessingMetadata({ [SUPPRESS_TRACING_KEY]: true });
        return callback();
    });
}


export function startNewTrace<T>(callback: () => T): T {
    return withScope(scope => {
        scope.setPropagationContext(generatePropagationContext());
        logger.info(`Starting a new trace with id ${scope.getPropagationContext().traceId}`);
        return withActiveSpan(null, callback);
    });
}

function getAcs(): AsyncContextStrategy {
    const carrier = getMainCarrier();
    return getAsyncContextStrategy(carrier);
}


function _startRootSpan(spanArguments: RibbanSpanArguments, scope: Scope, parentSampled?: boolean): RibbanSpan {
    const client = getClient();
    const options: Partial<ClientOptions> = (client && client.getOptions()) || {};

    const { name = '', attributes } = spanArguments;
    const [sampled, sampleRate] = scope.getScopeData().sdkProcessingMetadata[SUPPRESS_TRACING_KEY]
        ? [false]
        : sampleSpan(options, {
            name,
            parentSampled,
            attributes,
            transactionContext: {
                name,
                parentSampled,
            },
        });

    const rootSpan = new RibbanSpan({
        ...spanArguments,
        attributes: {
            [SEMANTIC_ATTRIBUTE_RIBBAN_SOURCE]: 'custom',
            ...spanArguments.attributes,
        },
        sampled,
    });
    if (sampleRate !== undefined) {
        rootSpan.setAttribute(SEMANTIC_ATTRIBUTE_RIBBAN_SAMPLE_RATE, sampleRate);
    }

    if (client) {
        client.emit('spanStart', rootSpan);
    }

    return rootSpan;
}

function _startChildSpan(parentSpan: Span, scope: Scope, spanArguments: RibbanSpanArguments): Span {
    const { spanId, traceId } = parentSpan.spanContext();
    const sampled = scope.getScopeData().sdkProcessingMetadata[SUPPRESS_TRACING_KEY] ? false : spanIsSampled(parentSpan);

    const childSpan = sampled
        ? new RibbanSpan({
            ...spanArguments,
            parentSpanId: spanId,
            traceId,
            sampled,
        })
        : new SentryNonRecordingSpan({ traceId });

    addChildSpanToSpan(parentSpan, childSpan);

    const client = getClient();
    if (client) {
        client.emit('spanStart', childSpan);
        // If it has an endTimestamp, it's already ended
        if (spanArguments.endTimestamp) {
            client.emit('spanEnd', childSpan);
        }
    }

    return childSpan;
}

function getParentSpan(scope: Scope): RibbanSpan | undefined {
    const span = _getSpanForScope(scope) as RibbanSpan | undefined;

    if (!span) {
        return undefined;
    }

    const client = getClient();
    const options: Partial<ClientOptions> = client ? client.getOptions() : {};
    if (options.parentSpanIsAlwaysRootSpan) {
        return getRootSpan(span) as RibbanSpan;
    }

    return span;
}