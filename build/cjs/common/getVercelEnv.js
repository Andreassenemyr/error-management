Object.defineProperty(exports, '__esModule', { value: true });

function getVercelEnv(isClient) {
    const vercelEnvVar = isClient ? process.env.NEXT_PUBLIC_VERCEL_ENV : process.env.VERCEL_ENV;
    return vercelEnvVar ? `vercel-${vercelEnvVar}` : undefined;
}

exports.getVercelEnv = getVercelEnv;
//# sourceMappingURL=getVercelEnv.js.map
