function getVercelEnv(isClient) {
    const vercelEnvVar = process.env.NEXT_PUBLIC_VERCEL_ENV ;
    return vercelEnvVar ? `vercel-${vercelEnvVar}` : undefined;
}

export { getVercelEnv };
//# sourceMappingURL=getVercelEnv.js.map
