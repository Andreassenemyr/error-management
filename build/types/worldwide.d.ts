import { Scope } from "./index";
export interface InternalGlobal {
    navigator?: {
        userAgent?: string;
    };
    console: Console;
    Ribban?: any;
    onerror?: {
        (event: object | string, source?: string, lineno?: number, colno?: number, error?: Error): any;
        __RIBBAN_INSTRUMENTED__?: true;
        __RIBBAN_LOADER__?: true;
    };
    onunhandledrejection?: {
        (event: unknown): boolean;
        __RIBBAN_INSTRUMENTED__?: true;
        __RIBBAN_LOADER__?: true;
    };
    RIBBAN_ENVIRONMENT?: string;
    RIBBAN_DSN?: string;
    RIBBAN_RELEASE?: {
        id?: string;
    };
    /**
     * Debug IDs are indirectly injected by Ribban CLI or bundler plugins to directly reference a particular source map
     * for resolving of a source file. The injected code will place an entry into the record for each loaded bundle/JS
     * file.
     */
    _ribbanDebugIds?: Record<string, string>;
    __RIBBAN__: {
        hub: any;
        logger: any;
        extensions?: {
            /** Extension methods for the hub, which are bound to the current Hub instance */
            [key: string]: Function;
        };
        globalScope: Scope | undefined;
        defaultCurrentScope: Scope | undefined;
        defaultIsolationScope: Scope | undefined;
        /** Overwrites TextEncoder used in `@ribban/utils`, need for `react-native@0.73` and older */
        encodePolyfill?: (input: string) => Uint8Array;
        /** Overwrites TextDecoder used in `@ribban/utils`, need for `react-native@0.73` and older */
        decodePolyfill?: (input: Uint8Array) => string;
    };
    /**
     * Raw module metadata that is injected by bundler plugins.
     *
     * Keys are `error.stack` strings, values are the metadata.
     */
    _ribbanModuleMetadata?: Record<string, any>;
    _ribbanEsmLoaderHookRegistered?: boolean;
}
export declare const GLOBAL_OBJ: InternalGlobal;
export declare function getGlobalSingleton<T>(name: keyof InternalGlobal['__RIBBAN__'], creator: () => T, obj?: unknown): T;
//# sourceMappingURL=worldwide.d.ts.map