import { context } from '@opentelemetry/api';
import { suppressTracing as suppressTracing$1 } from '@opentelemetry/core';

/** Suppress tracing in the given callback, ensuring no spans are generated inside of it. */
function suppressTracing(callback) {
    const ctx = suppressTracing$1(context.active());
    return context.with(ctx, callback);
}

export { suppressTracing };
//# sourceMappingURL=supress-tracing.js.map
