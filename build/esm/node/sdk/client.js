import { _optionalChain } from '@sentry/utils';
import * as os from 'node:os';
import { trace } from '@opentelemetry/api';
import { isMainThread, threadId } from 'worker_threads';
import { logger } from '../../utils/logger.js';
import { ServerRuntimeClient } from '../../server-runtime-client.js';

/** A client for using Sentry with Node & OpenTelemetry. */
class NodeClient extends ServerRuntimeClient {

     constructor(options) {
        const clientOptions = {
            ...options,
            platform: 'node',
            runtime: { name: 'node', version: global.process.version },
            serverName: options.serverName || global.process.env.SENTRY_NAME || os.hostname(),
        };

        logger.log(`Initializing Ribban o0: process: ${process.pid}, thread: ${isMainThread ? 'main' : `worker-${threadId}`}.`,);

        super(clientOptions);
    }

    /** Get the OTEL tracer. */
     get tracer() {
        if (this._tracer) {
            return this._tracer;
        }

        const name = '@ribban/error-management-node';
        const version = '1.0';
        const tracer = trace.getTracer(name, version);
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

export { NodeClient };
//# sourceMappingURL=client.js.map
