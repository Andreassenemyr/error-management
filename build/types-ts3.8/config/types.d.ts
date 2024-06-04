export type ExportedNextConfig = NextConfigObject | NextConfigFunction;
type NextRewrite = {
    source: string;
    destination: string;
};
export type NextConfigObject = {
    webpack?: WebpackConfigFunction | null;
    target?: 'server' | 'experimental-serverless-trace';
    distDir?: string;
    assetPrefix?: string;
    basePath?: string;
    publicRuntimeConfig?: {
        [key: string]: unknown;
    };
    pageExtensions?: string[];
    output?: string;
    rewrites?: () => Promise<NextRewrite[] | {
        beforeFiles?: NextRewrite[];
        afterFiles?: NextRewrite[];
        fallback?: NextRewrite[];
    }>;
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
export type NextConfigFunction = (phase: string, defaults: {
    defaultConfig: NextConfigObject;
}) => NextConfigObject | PromiseLike<NextConfigObject>;
export type WebpackConfigFunction = (config: WebpackConfigObject, options: BuildContext) => WebpackConfigObject;
export type WebpackConfigObject = {
    devtool?: string;
    entry: WebpackEntryProperty;
    output: {
        filename: string;
        path: string;
    };
    target: string;
    context: string;
    ignoreWarnings?: {
        module?: RegExp;
    }[];
    resolve?: {
        modules?: string[];
        alias?: {
            [key: string]: string | boolean;
        };
    };
    module?: {
        rules: Array<WebpackModuleRule>;
    };
} & {
    [key: string]: unknown;
};
export type WebpackEntryProperty = EntryPropertyObject | EntryPropertyFunction;
export type EntryPropertyObject = {
    [key: string]: EntryPointValue;
};
export type EntryPropertyFunction = () => Promise<EntryPropertyObject>;
export type EntryPointValue = string | Array<string> | EntryPointObject;
export type EntryPointObject = {
    import: string | Array<string>;
};
export type BuildContext = {
    dev: boolean;
    isServer: boolean;
    buildId: string;
    dir: string;
    config: any;
    webpack: {
        version: string;
    };
    defaultLoaders: any;
    totalPages: number;
    nextRuntime?: 'nodejs' | 'edge';
};
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
export {};
//# sourceMappingURL=types.d.ts.map
