import { getVercelEnv } from '../common/getVercelEnv';
import { isBuild } from '../common/isBuild';
import { getClient } from '../current-scopes';
import { NodeOptions } from '../node/types';
import { logger } from '../utils/logger';
import { GLOBAL_OBJ } from '../worldwide';
import { init as nodeInit } from "../node"

export { withRibbanConfig } from '../config';

const globalWithInjectedValues = GLOBAL_OBJ as typeof GLOBAL_OBJ & {
    __rewriteFramesDistDir__?: string;
    __ribbanRewritesTunnelPath__?: string;
};

const NEXTJS_SPAN_NAME_PREFIXES = [
    'BaseServer.',
    'LoadComponents.',
    'NextServer.',
    'createServer.',
    'startServer.',
    'NextNodeServer.',
    'Render.',
    'AppRender.',
    'Router.',
    'Node.',
    'AppRouteRouteHandlers.',
    'ResolveMetadata.',
];


export function init(options: NodeOptions) {
    if (isBuild()) {
        return;
    }

    const newOptions: NodeOptions = {
        environment: getVercelEnv(false) || process.env.NODE_ENV,
        ...options,
        autoSessionTracking: false
    };

    if (options.debug) {
        logger.enable();
    }

    logger.log('Initializing Ribban o0.');

    if (sdkAlreadyInitialized()) {
        logger.log('SDK already initialized. Skipping initialization.');
        return;
    }
    
    nodeInit(newOptions);

    const client = getClient();

    logger.log('Ribban o0 initialized.');
};

function sdkAlreadyInitialized(): boolean {
    return !!getClient();
}

export * from '../node/types';
export * from '../index';
