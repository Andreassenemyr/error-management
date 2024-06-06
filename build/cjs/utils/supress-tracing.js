Object.defineProperty(exports, '__esModule', { value: true });

const api = require('@opentelemetry/api');
const core = require('@opentelemetry/core');

/** Suppress tracing in the given callback, ensuring no spans are generated inside of it. */
function suppressTracing(callback) {
    const ctx = core.suppressTracing(api.context.active());
    return api.context.with(ctx, callback);
}

exports.suppressTracing = suppressTracing;
//# sourceMappingURL=supress-tracing.js.map
