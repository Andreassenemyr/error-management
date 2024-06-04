import { CaptureContext } from "./index";
import { BaseTransportOptions, Transport } from "./transport";
import { StackParser } from "./types/stacktrace";
export interface ClientOptions<TO extends BaseTransportOptions = BaseTransportOptions> {
    debug?: boolean;
    attachStacktrace?: boolean;
    enabled?: boolean;
    autoSessionTracking?: boolean;
    dsn?: string;
    /** The current environment of your application (e.g. "production"). */
    environment?: string;
    transport: (transportOptions: TO) => Transport;
    transportOptions?: Partial<TO>;
    initialScope?: CaptureContext;
    maxBreadcrumbs?: number;
    sampleRate?: number;
    maxValueLength?: number;
    ignoreErrors?: Array<string | RegExp>;
    tunnel?: string;
    allowUrls?: Array<string | RegExp>;
    denyUrls?: Array<string | RegExp>;
    normalizeDepth?: number;
    stackParser: StackParser;
}
export interface Options<TO extends BaseTransportOptions = BaseTransportOptions> extends Omit<Partial<ClientOptions<TO>>, 'transport'> {
    transport?: (transportOptions: TO) => Transport;
}
//# sourceMappingURL=options.d.ts.map