import { BrowserOptions } from '../types';
import { getVercelEnv } from '../common/getVercelEnv';
import { init as BrowserInit } from '../init';

export * from '../index';

export function withRibbanConfig<T>(exportedUserNextConfig: T): T {
    return exportedUserNextConfig;
}

export function init(options: BrowserOptions) {
    const newOptions = {
        environment: getVercelEnv(true) || process.env.NODE_ENV,
        ...options
    } satisfies BrowserOptions;

    BrowserInit(newOptions);
};

export { getClient } from '../current-scopes';
export * from '../types';