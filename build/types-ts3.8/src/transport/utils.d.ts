export type FetchImpl = typeof fetch;
export declare function isNativeFetch(func: Function): boolean;
export declare function getNativeFetchImplementation(): FetchImpl | undefined;
/** Clears cached fetch impl */
export declare function clearCachedFetchImplementation(): void;
//# sourceMappingURL=utils.d.ts.map
