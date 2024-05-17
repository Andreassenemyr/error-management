import { WINDOW } from "../helpers/helpers";
import { logger } from "../utils/logger";

export type FetchImpl = typeof fetch;

export function isNativeFetch(func: Function): boolean {
    return func && /^function fetch\(\)\s+\{\s+\[native code\]\s+\}$/.test(func.toString());
}

let cachedFetchImpl: FetchImpl | undefined = undefined;

export function getNativeFetchImplementation(): FetchImpl | undefined {
    if (cachedFetchImpl) {
        return cachedFetchImpl;
    }
  
    /* eslint-disable @typescript-eslint/unbound-method */
  
    // Fast path to avoid DOM I/O
    if (isNativeFetch(WINDOW.fetch)) {
        return (cachedFetchImpl = WINDOW.fetch.bind(WINDOW));
    }
  
    const document = WINDOW.document;
    let fetchImpl = WINDOW.fetch;
    // eslint-disable-next-line deprecation/deprecation
    if (document && typeof document.createElement === 'function') {
        try {
            const sandbox = document.createElement('iframe');
            sandbox.hidden = true;
            document.head.appendChild(sandbox);
            const contentWindow = sandbox.contentWindow;
            if (contentWindow && contentWindow.fetch) {
                fetchImpl = contentWindow.fetch;
            }

            document.head.removeChild(sandbox);
        } catch (e) {
            logger.warn('Could not create sandbox iframe for pure fetch check, bailing to window.fetch: ', e);
        }
    }
  
    try {
        return (cachedFetchImpl = fetchImpl.bind(WINDOW));
    } catch (e) {
        // empty
    }
  
    return undefined;
    /* eslint-enable @typescript-eslint/unbound-method */
  }
  
/** Clears cached fetch impl */
export function clearCachedFetchImplementation(): void {
    cachedFetchImpl = undefined;
}