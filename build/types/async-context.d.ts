import { Scope } from "./index";
import { Carrier } from "./carrier";
import { Client } from "./client";
export interface AsyncContextStrategy {
    /**
     * Fork the isolation scope inside of the provided callback.
     */
    withIsolationScope: <T>(callback: (isolationScope: Scope) => T) => T;
    /**
     * Fork the current scope inside of the provided callback.
     */
    withScope: <T>(callback: (isolationScope: Scope) => T) => T;
    /**
     * Set the provided scope as the current scope inside of the provided callback.
     */
    withSetScope: <T>(scope: Scope, callback: (scope: Scope) => T) => T;
    /**
     * Set the provided isolation as the current isolation scope inside of the provided callback.
     */
    withSetIsolationScope: <T>(isolationScope: Scope, callback: (isolationScope: Scope) => T) => T;
    /**
     * Get the currently active scope.
     */
    getCurrentScope: () => Scope;
    /**
     * Get the currently active isolation scope.
     */
    getIsolationScope: () => Scope;
}
export declare function setAsyncContextStrategy(strategy: AsyncContextStrategy | undefined): void;
interface Layer {
    client?: Client;
    scope: Scope;
}
/**
 * Get the current async context strategy.
 * If none has been setup, the default will be used.
 */
export declare function getAsyncContextStrategy(carrier: Carrier): AsyncContextStrategy;
export declare class AsyncContextStack {
    private readonly _stack;
    private _isolationScope;
    constructor(scope?: Scope, isolationScope?: Scope);
    /**
     * Fork a scope for the stack.
     */
    withScope<T>(callback: (scope: Scope) => T): T;
    /**
     * Get the client of the stack.
     */
    getClient<C extends Client>(): C | undefined;
    /**
     * Returns the scope of the top stack.
     */
    getScope(): Scope;
    /**
     * Get the isolation scope for the stack.
     */
    getIsolationScope(): Scope;
    /**
     * Returns the scope stack for domains or the process.
     */
    getStack(): Layer[];
    /**
     * Returns the topmost scope layer in the order domain > local > process.
     */
    getStackTop(): Layer;
    /**
     * Push a scope to the stack.
     */
    private _pushScope;
    /**
     * Pop a scope from the stack.
     */
    private _popScope;
}
export declare function getStackAsyncContextStrategy(): AsyncContextStrategy;
export {};
//# sourceMappingURL=async-context.d.ts.map