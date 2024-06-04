
export type ExportedNextConfig = NextConfigObject | NextConfigFunction;

type NextRewrite = {
    source: string;
    destination: string;
};

export type NextConfigObject = {
    // Custom webpack options
    webpack?: WebpackConfigFunction | null;
    // Whether to build serverless functions for all pages, not just API routes. Removed in nextjs 12+.
    target?: 'server' | 'experimental-serverless-trace';
    // The output directory for the built app (defaults to ".next")
    distDir?: string;
    // URL location of `_next/static` directory when hosted on a CDN
    assetPrefix?: string;
    // The root at which the nextjs app will be served (defaults to "/")
    basePath?: string;
    // Config which will be available at runtime
    publicRuntimeConfig?: { [key: string]: unknown };
    // File extensions that count as pages in the `pages/` directory
    pageExtensions?: string[];
    // Whether Next.js should do a static export
    output?: string;
    // Paths to reroute when requested
    rewrites?: () => Promise<
        | NextRewrite[]
        | {
            beforeFiles?: NextRewrite[];
            afterFiles?: NextRewrite[];
            fallback?: NextRewrite[];
        }
    >;
    // Next.js experimental options
    experimental?: {
        instrumentationHook?: boolean;
        clientTraceMetadata?: string[];
    };
    productionBrowserSourceMaps?: boolean;
};

export type RibbanBuildOptions = {
    autoInstrumentServerFunctions?: boolean;
    excludeServerRoutes?: Array<RegExp | string>;
    autoInstrumentMiddleware?: boolean;
    autoInstrumentAppDirectory?: boolean;
};

export type NextConfigFunction = (
    phase: string,
    defaults: { defaultConfig: NextConfigObject },
) => NextConfigObject | PromiseLike<NextConfigObject>;

export type WebpackConfigFunction = (config: WebpackConfigObject, options: BuildContext) => WebpackConfigObject;
export type WebpackConfigObject = {
    devtool?: string;
    entry: WebpackEntryProperty;
    output: { filename: string; path: string };
    target: string;
    context: string;
    ignoreWarnings?: { module?: RegExp }[]; // Note: The interface for `ignoreWarnings` is larger but we only need this. See https://webpack.js.org/configuration/other-options/#ignorewarnings
    resolve?: {
        modules?: string[];
        alias?: { [key: string]: string | boolean };
    };
    module?: {
        rules: Array<WebpackModuleRule>;
    };
} & {
    // Other webpack options
    [key: string]: unknown;
};


export type WebpackEntryProperty = EntryPropertyObject | EntryPropertyFunction;

export type EntryPropertyObject = {
    [key: string]: EntryPointValue;
};

export type EntryPropertyFunction = () => Promise<EntryPropertyObject>;

export type EntryPointValue = string | Array<string> | EntryPointObject;
export type EntryPointObject = { import: string | Array<string> };

export type BuildContext = {
    dev: boolean;
    isServer: boolean;
    buildId: string;
    dir: string;
    config: any;
    webpack: {
        version: string;
    }
    defaultLoaders: any;
    totalPages: number;
    nextRuntime?: 'nodejs' | 'edge';
}

export type WebpackModuleRule = {
    test?: string | RegExp | ((resourcePath: string) => boolean);
    include?: Array<string | RegExp> | RegExp;
    exclude?: (filepath: string) => boolean;
    use?: ModuleRuleUseProperty | Array<ModuleRuleUseProperty>;
    oneOf?: Array<WebpackModuleRule>;
};

export type WebpackConfigObjectWithModuleRules = WebpackConfigObject & Required<Pick<WebpackConfigObject, 'module'>>;

export type ModuleRuleUseProperty = {
    loader?: string;
    options?: Record<string, unknown>;
};