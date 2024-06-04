import { Scope } from "./index";
import { Client } from "./client";
export declare function getDefaultCurrentScope(): Scope;
export declare function getDefaultIsolationScope(): Scope;
export declare function getClient<C extends Client>(): C | undefined;
export declare function getCurrentScope(): Scope;
export declare function getIsolationScope(): Scope;
export declare function withIsolationScope<T>(callback: (isolationScope: Scope) => T): T;
export declare function withIsolationScope<T>(isolationScope: Scope | undefined, callback: (isolationScope: Scope) => T): T;
//# sourceMappingURL=current-scopes.d.ts.map