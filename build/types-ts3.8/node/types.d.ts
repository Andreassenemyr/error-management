import { Scope } from "..";
import { Span as WriteableSpan } from '@opentelemetry/api';
import { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { ClientOptions, Options } from "../options";
import { NodeTransportOptions } from "./transports";
export interface BaseNodeOptions {
    profilesSamplingRate?: number;
    serverName?: string;
    includeLocalVariables?: boolean;
    spotlight?: boolean | string;
    tracesSampleRate?: number;
    onFatalError?(this: void, error: Error): void;
}
export interface NodeOptions extends Options<NodeTransportOptions>, BaseNodeOptions {
}
export interface NodeClientOptions extends ClientOptions<NodeTransportOptions>, BaseNodeOptions {
}
export type AbstractSpan = WriteableSpan | ReadableSpan;
export interface CustomSamplingContext {
    [key: string]: any;
}
export interface CurrentScopes {
    scope: Scope;
    isolationScope: Scope;
}
//# sourceMappingURL=types.d.ts.map
