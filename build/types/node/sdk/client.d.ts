import type { Tracer } from '@opentelemetry/api';
import type { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';
import { NodeClientOptions } from '../types';
import { ServerRuntimeClient } from '../../server-runtime-client';
/** A client for using Sentry with Node & OpenTelemetry. */
export declare class NodeClient extends ServerRuntimeClient<NodeClientOptions> {
    traceProvider: BasicTracerProvider | undefined;
    private _tracer;
    constructor(options: NodeClientOptions);
    /** Get the OTEL tracer. */
    get tracer(): Tracer;
    /**
     * @inheritDoc
     */
    flush(timeout?: number): Promise<boolean>;
}
//# sourceMappingURL=client.d.ts.map