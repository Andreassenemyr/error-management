var {
    _optionalChain
} = require('@sentry/utils');

Object.defineProperty(exports, '__esModule', { value: true });

const os = require('node:os');
const api = require('@opentelemetry/api');
const worker_threads = require('worker_threads');
const logger = require('../../utils/logger.js');
const serverRuntimeClient = require('../../server-runtime-client.js');

/** A client for using Sentry with Node & OpenTelemetry. */
class NodeClient extends serverRuntimeClient.ServerRuntimeClient {

     constructor(options) {
        const clientOptions = {
            ...options,
            platform: 'node',
            runtime: { name: 'node', version: global.process.version },
            serverName: options.serverName || global.process.env.SENTRY_NAME || os.hostname(),
        };

        logger.logger.log(`Initializing Ribban o0: process: ${process.pid}, thread: ${worker_threads.isMainThread ? 'main' : `worker-${worker_threads.threadId}`}.`,);

        super(clientOptions);
    }

    /** Get the OTEL tracer. */
     get tracer() {
        if (this._tracer) {
            return this._tracer;
        }

        const name = '@ribban/error-management-node';
        const version = '1.0';
        const tracer = api.trace.getTracer(name, version);
        this._tracer = tracer;

        return tracer;
    }

    /**
     * @inheritDoc
     */
     async flush(timeout) {
        const provider = this.traceProvider;
        const spanProcessor = _optionalChain([provider, 'optionalAccess', _ => _.activeSpanProcessor]);

        if (spanProcessor) {
            await spanProcessor.forceFlush();
        }

        return super.flush(timeout);
    }
}

exports.NodeClient = NodeClient;
//# sourceMappingURL=client.js.map
