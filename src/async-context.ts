import { Scope } from "./index";
import { Carrier, getMainCarrier, getRibbanCarrier } from "./carrier";
import { Client } from "./client";
import { getDefaultCurrentScope, getDefaultIsolationScope } from "./current-scopes";
import { Scope as ScopeClass } from "./scope"; 
import { isThenable } from "./transport/syncpromise";

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

export function setAsyncContextStrategy(strategy: AsyncContextStrategy | undefined): void {
    // Get main carrier (global for every environment)
    const registry = getMainCarrier();
    const ribbanCarrier = getRibbanCarrier(registry);
    ribbanCarrier.acs = strategy;
}

interface Layer {
    client?: Client;
    scope: Scope;
}
  
  /**
   * Get the current async context strategy.
   * If none has been setup, the default will be used.
   */
export function getAsyncContextStrategy(carrier: Carrier): AsyncContextStrategy {
    const ribban = getRibbanCarrier(carrier);
  
    if (ribban.acs) {
      return ribban.acs;
    }
  
    // Otherwise, use the default one (stack)
    return getStackAsyncContextStrategy();
}

export class AsyncContextStack {
    private readonly _stack: Layer[];
    private _isolationScope: Scope;
  
    public constructor(scope?: Scope, isolationScope?: Scope) {
      let assignedScope;
      if (!scope) {
        assignedScope = new ScopeClass();
      } else {
        assignedScope = scope;
      }
  
      let assignedIsolationScope;
      if (!isolationScope) {
        assignedIsolationScope = new ScopeClass();
      } else {
        assignedIsolationScope = isolationScope;
      }
  
      this._stack = [{ scope: assignedScope }];
      this._isolationScope = assignedIsolationScope;
    }
  
    /**
     * Fork a scope for the stack.
     */
    public withScope<T>(callback: (scope: Scope) => T): T {
      const scope = this._pushScope();
  
      let maybePromiseResult: T;
      try {
        maybePromiseResult = callback(scope);
      } catch (e) {
        this._popScope();
        throw e;
      }
  
      if (isThenable(maybePromiseResult)) {
        // @ts-expect-error - isThenable returns the wrong type
        return maybePromiseResult.then(
          res => {
            this._popScope();
            return res;
          },
          e => {
            this._popScope();
            throw e;
          },
        );
      }
  
      this._popScope();
      return maybePromiseResult;
    }
  
    /**
     * Get the client of the stack.
     */
    public getClient<C extends Client>(): C | undefined {
      return this.getStackTop().client as C;
    }
  
    /**
     * Returns the scope of the top stack.
     */
    public getScope(): Scope {
      return this.getStackTop().scope;
    }
  
    /**
     * Get the isolation scope for the stack.
     */
    public getIsolationScope(): Scope {
      return this._isolationScope;
    }
  
    /**
     * Returns the scope stack for domains or the process.
     */
    public getStack(): Layer[] {
      return this._stack;
    }
  
    /**
     * Returns the topmost scope layer in the order domain > local > process.
     */
    public getStackTop(): Layer {
      return this._stack[this._stack.length - 1];
    }
  
    /**
     * Push a scope to the stack.
     */
    private _pushScope(): Scope {
      // We want to clone the content of prev scope
      const scope = this.getScope().clone();
      this.getStack().push({
        client: this.getClient(),
        scope,
      });
      return scope;
    }
  
    /**
     * Pop a scope from the stack.
     */
    private _popScope(): boolean {
      if (this.getStack().length <= 1) return false;
      return !!this.getStack().pop();
    }
}

function getAsyncContextStack(): AsyncContextStack {
    const registry = getMainCarrier();
  
    // For now we continue to keep this as `hub` on the ACS,
    // as e.g. the Loader Script relies on this.
    // Eventually we may change this if/when we update the loader to not require this field anymore
    // Related, we also write to `hub` in {@link ./../sdk.ts registerClientOnGlobalHub}
    const ribban = getRibbanCarrier(registry) as { hub?: AsyncContextStack };
  
    if (ribban.hub) {
      return ribban.hub;
    }
  
    ribban.hub = new AsyncContextStack(getDefaultCurrentScope(), getDefaultIsolationScope());
    return ribban.hub;
}

function withScope<T>(callback: (scope: Scope) => T): T {
    return getAsyncContextStack().withScope(callback);
}
  
function withSetScope<T>(scope: Scope, callback: (scope: Scope) => T): T {
    const hub = getAsyncContextStack() as AsyncContextStack;
    return hub.withScope(() => {
      hub.getStackTop().scope = scope;
      return callback(scope);
    });
}

function withIsolationScope<T>(callback: (isolationScope: Scope) => T): T {
    return getAsyncContextStack().withScope(() => {
        return callback(getAsyncContextStack().getIsolationScope());
    });
} 
  

export function getStackAsyncContextStrategy(): AsyncContextStrategy {
    return {
        withIsolationScope,
        withScope,
        withSetScope,
        withSetIsolationScope: <T>(_isolationScope: Scope, callback: (isolationScope: Scope) => T) => {
          return withIsolationScope(callback);
        },
        getCurrentScope: () => getAsyncContextStack().getScope(),
        getIsolationScope: () => getAsyncContextStack().getIsolationScope(),
    };
}