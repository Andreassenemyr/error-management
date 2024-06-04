import { makeBaseNPMConfig, makeNPMConfigVariants } from "./src/config/utils/npmHelpers.mjs";

export default [
    ...makeNPMConfigVariants(
        makeBaseNPMConfig({
            entrypoints: [
                'src/index.server.ts',
                'src/index.client.ts',
                'src/client/index.ts',
                'src/server/index.ts',
                'src/edge/index.ts',
                'src/config/index.ts',
            ],
            
            packageSpecificConfig: {
                external: ['next/router', 'next/constants', 'next/headers', 'stacktrace-parser'],
            },
        })
    ),
    ...makeNPMConfigVariants(
        makeBaseNPMConfig({
            entrypoints: ['src/config/loaders/index.ts'],

            packageSpecificConfig: {
                output: {
                    entryFileNames: 'config/loaders/[name].js',
                    exports: 'named',
                },
                external: ['@rollup/plugin-commonjs', 'rollup']
            },
        })
    )
]