import { HostComponent } from "./dsn";
import { StackLineParserFn } from "./types/stacktrace";
export declare function getEnvelopeEndpointWithUrlEncodedAuth(dsn: HostComponent, tunnel?: string): string;
export type GetModuleFn = (filename: string | undefined) => string | undefined;
/**
 * Does this filename look like it's part of the app code?
 */
export declare function filenameIsInApp(filename: string, isNative?: boolean): boolean;
export declare function node(getModule?: GetModuleFn): StackLineParserFn;
//# sourceMappingURL=api.d.ts.map