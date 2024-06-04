import { Scope } from "..";
import type { Span as WriteableSpan } from '@opentelemetry/api';
import type { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { ClientOptions, Options } from "../options";
import { NodeTransportOptions } from "./transports";
import { Span } from "./span/types";

export interface BaseNodeOptions {
    profilesSamplingRate?: number;

    profilesSampler?: (samplingContext: SamplingContext) => number | boolean;

    serverName?: string;

    includeLocalVariables?: boolean;

    spotlight?: boolean | string;

    onFatalError?(this: void, error: Error): void;
}

export interface NodeOptions extends Options<NodeTransportOptions>, BaseNodeOptions {}

export interface NodeClientOptions extends ClientOptions<NodeTransportOptions>, BaseNodeOptions {}

export type AbstractSpan = WriteableSpan | ReadableSpan | Span;

export interface CustomSamplingContext {
    [key: string]: any;
}

export interface SamplingContext extends CustomSamplingContext {
    /**
     * Context data with which transaction being sampled was created.
     * @deprecated This is duplicate data and will be removed eventually.
     */
    transactionContext: {
      name: string;
      parentSampled?: boolean | undefined;
    };
  
    /**
     * Sampling decision from the parent transaction, if any.
     */
    parentSampled?: boolean;
  
    /**
     * Object representing the URL of the current page or worker script. Passed by default when using the `BrowserTracing`
     * integration.
     */
    location?: WorkerLocation;
  
    /**
     * Object representing the incoming request to a node server. Passed by default when using the TracingHandler.
     */
    request?: ExtractedNodeRequestData;
  
    /** The name of the span being sampled. */
    name: string;
  
    /** Initial attributes that have been passed to the span being sampled. */
    attributes?: SpanAttributes;
}

export interface CurrentScopes {
    scope: Scope;
    isolationScope: Scope;
}