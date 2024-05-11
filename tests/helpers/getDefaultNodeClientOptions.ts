import { createTransport } from "../../src/transport/base";
import { resolvedSyncPromise } from "../../src/transport/syncpromise";
import { NodeClientOptions } from "../../src/types";

export function getDefaultNodeClientOptions(options: Partial<NodeClientOptions> = {}): NodeClientOptions {
    return {
      dsn: 'https://username@domain/123',
      transport: () => createTransport({}, _ => resolvedSyncPromise({})),
      stackParser: () => [],
      ...options,
    };
}