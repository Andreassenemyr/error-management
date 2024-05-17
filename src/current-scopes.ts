import { getGlobalSingleton } from "./worldwide";
import { Scope as ScopeClass } from "./scope";
import { Scope } from "./index";
import { getMainCarrier } from "./carrier";
import { getAsyncContextStrategy } from "./async-context";
import { Client } from "./client";

export function getDefaultCurrentScope(): Scope {
    return getGlobalSingleton('defaultCurrentScope', () => new ScopeClass());
}

export function getDefaultIsolationScope(): Scope {
    return getGlobalSingleton('defaultIsolationScope', () => new ScopeClass());
}

export function getClient<C extends Client>(): C | undefined {
    return getCurrentScope().getClient<C>();
}

export function getCurrentScope(): Scope {
    const carrier = getMainCarrier();
    const acs = getAsyncContextStrategy(carrier);
    return acs.getCurrentScope();
}

export function getIsolationScope(): Scope {
    const carrier = getMainCarrier();
    const acs = getAsyncContextStrategy(carrier);
    return acs.getIsolationScope();
};
  
export function withIsolationScope<T>(callback: (isolationScope: Scope) => T): T;

export function withIsolationScope<T>(isolationScope: Scope | undefined, callback: (isolationScope: Scope) => T): T;

export function withIsolationScope<T>(
    ...rest:
      | [callback: (isolationScope: Scope) => T]
      | [isolationScope: Scope | undefined, callback: (isolationScope: Scope) => T]
  ): T {
    const carrier = getMainCarrier();
    const acs = getAsyncContextStrategy(carrier);
  
    // If a scope is defined, we want to make this the active scope instead of the default one
    if (rest.length === 2) {
        const [isolationScope, callback] = rest;
        
        if (!isolationScope) {
          return acs.withIsolationScope(callback);
        }
      
        return acs.withSetIsolationScope(isolationScope, callback);
    }
  
    return acs.withIsolationScope(rest[0]);
}