import * as os from 'node:os';
import type { Tracer } from '@opentelemetry/api';
import { trace } from '@opentelemetry/api';
import type { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';
import { isMainThread, threadId } from 'worker_threads';
import { ServerRuntimeClientOptions } from '../../client';
import { logger } from '../../utils/logger';
import { NodeClientOptions } from '../types';
import { ServerRuntimeClient } from '../../server-runtime-client';

/** A client for using Sentry with Node & OpenTelemetry. */
export class NodeClient extends ServerRuntimeClient<NodeClientOptions> {
    public traceProvider: BasicTracerProvider | undefined;
    private _tracer: Tracer | undefined;

    public constructor(options: NodeClientOptions) {
        const clientOptions: ServerRuntimeClientOptions = {
            ...options,
            platform: 'node',
            runtime: { name: 'node', version: global.process.version },
            serverName: options.serverName || global.process.env.SENTRY_NAME || os.hostname(),
        };

        logger.log(`Initializing Ribban o0: process: ${process.pid}, thread: ${isMainThread ? 'main' : `worker-${threadId}`}.`,);

        super(clientOptions);
    }

    /** Get the OTEL tracer. */
    public get tracer(): Tracer {
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
    public async flush(timeout?: number): Promise<boolean> {
        const provider = this.traceProvider;
        const spanProcessor = provider?.activeSpanProcessor;

        if (spanProcessor) {
            await spanProcessor.forceFlush();
        }

        return super.flush(timeout);
    }
}