import { context, createContextKey } from "@opentelemetry/api";
import { Scope } from "../..";
import { CurrentScopes } from "../types";

export const RIBBAN_SCOPES_CONTEXT_KEY = createContextKey('ribban_scopes');

export function setIsolationScope(isolationScope: Scope): void {
    const scopes = context.active().getValue(RIBBAN_SCOPES_CONTEXT_KEY) as CurrentScopes | undefined;
    if (scopes) {
        scopes.isolationScope = isolationScope;
    }
}