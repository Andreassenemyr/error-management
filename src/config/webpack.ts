import { BuildContext, EntryPointObject, EntryPropertyObject, NextConfigObject, RibbanBuildOptions, WebpackConfigFunction, WebpackConfigObject, WebpackConfigObjectWithModuleRules, WebpackEntryProperty } from "./types";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { sync as resolveSync } from "resolve";

let showedMissingGlobalErrorWarningMsg = false;

export function escapeStringForRegex(regexString: string): string {
    // escape the hyphen separately so we can also replace it with a unicode literal hyphen, to avoid the problems
    // discussed in https://github.com/sindresorhus/escape-string-regexp/issues/20.
    return regexString.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
}

export function constructWebpackConfigFunction(
    userNextConfig: NextConfigObject = {},
    userRibbanConfig: RibbanBuildOptions = {}
): WebpackConfigFunction {
    
    return function newWebpackFunction(
        incomingConfig: WebpackConfigObject,
        buildContext: BuildContext
    ): WebpackConfigObject {
        const { isServer, dev: isDev, dir: projectDirectory } = buildContext;
        const runtime = isServer ? (buildContext.nextRuntime === 'edge' ? 'edge' : 'server') : 'client';

        let rawNewConfig = { ...incomingConfig };

        if ('webpack' in userNextConfig && typeof userNextConfig.webpack === 'function') {
            rawNewConfig = userNextConfig.webpack(rawNewConfig, buildContext);
        }

        const newConfig = setUpModuleRules(rawNewConfig);

        let pagesDirPath: string | undefined;
        const maybePagesDirPath = path.join(projectDirectory, 'pages');
        const maybeSrcPagesDirPath = path.join(projectDirectory, 'src', 'pages');
        if (fs.existsSync(maybePagesDirPath) && fs.lstatSync(maybePagesDirPath).isDirectory()) {
            pagesDirPath = maybePagesDirPath;
        } else if (fs.existsSync(maybeSrcPagesDirPath) && fs.lstatSync(maybeSrcPagesDirPath).isDirectory()) {
            pagesDirPath = maybeSrcPagesDirPath;
        }

        let appDirPath: string | undefined;
        const maybeAppDirPath = path.join(projectDirectory, 'app');
        const maybeSrcAppDirPath = path.join(projectDirectory, 'src', 'app');
        if (fs.existsSync(maybeAppDirPath) && fs.lstatSync(maybeAppDirPath).isDirectory()) {
            appDirPath = maybeAppDirPath;
        } else if (fs.existsSync(maybeSrcAppDirPath) && fs.lstatSync(maybeSrcAppDirPath).isDirectory()) {
            appDirPath = maybeSrcAppDirPath;
        }

        const apiRoutesPath = pagesDirPath ? path.join(pagesDirPath, 'api') : undefined;

        const middlewareLocationFolder = pagesDirPath
            ? path.join(pagesDirPath, '..')
            : appDirPath
                ? path.join(appDirPath, '..')
                : projectDirectory;

        const pageExtensions = userNextConfig.pageExtensions || ['tsx', 'ts', 'jsx', 'js'];
        const dotPrefixedPageExtensions = pageExtensions.map(ext => `.${ext}`);
        const pageExtensionRegex = pageExtensions.map(escapeStringForRegex).join('|');

        const staticWrappingLoaderOptions = {
            appDir: appDirPath,
            pagesDir: pagesDirPath,
            pageExtensionRegex: pageExtensionRegex,
            excludeServerRoutes: userRibbanConfig.excludeServerRoutes,
            nextjsRequestAsyncStorageModulePath: getRequestAsyncStorageModuleLocation(
                projectDirectory,
                rawNewConfig.resolve?.modules,
            ),
        }

        const normalizeLoaderResourcePath = (resourcePath: string): string => {
            // `resourcePath` may be an absolute path or a path relative to the context of the webpack config
            let absoluteResourcePath: string;
            if (path.isAbsolute(resourcePath)) {
                absoluteResourcePath = resourcePath;
            } else {
                absoluteResourcePath = path.join(projectDirectory, resourcePath);
            }

            return path.normalize(absoluteResourcePath);
        };

        const isPageResource = (resourcePath: string): boolean => {
            const normalizedAbsoluteResourcePath = normalizeLoaderResourcePath(resourcePath);
            return (
                pagesDirPath !== undefined &&
                normalizedAbsoluteResourcePath.startsWith(pagesDirPath + path.sep) &&
                !normalizedAbsoluteResourcePath.startsWith(apiRoutesPath + path.sep) &&
                dotPrefixedPageExtensions.some(ext => normalizedAbsoluteResourcePath.endsWith(ext))
            );
        };



        if (appDirPath) {
            const hasGlobalErrorFile = ['global-error.js', 'global-error.ts', 'global-error.jsx', 'global-error.tsx'].some(
                file => fs.existsSync(path.join(appDirPath!, file)),
            );

            if (!hasGlobalErrorFile && !showedMissingGlobalErrorWarningMsg) {
                console.warn(
                    'Ribban [Warning]:',
                    'You have not created a `global-error.js` file in your app directory. This file is required for Ribban to properly capture errors in your app.',
                );

                showedMissingGlobalErrorWarningMsg = true;
            }
        }

        if (!isServer) {
            const origEntryPoint = newConfig.entry;
            newConfig.entry = async () => addRibbanToClientEntryPoint(origEntryPoint, buildContext);
        }

        return newConfig;
    }
}

function setUpModuleRules(newConfig: WebpackConfigObject): WebpackConfigObjectWithModuleRules {
    newConfig.module = {
        ...newConfig.module,
        rules: [...(newConfig.module?.rules || [])],
    };
    // Surprising that we have to assert the type here, since we've demonstrably guaranteed the existence of
    // `newConfig.module.rules` just above, but ¯\_(ツ)_/¯
    return newConfig as WebpackConfigObjectWithModuleRules;
}

async function addRibbanToClientEntryPoint(
    currentEntryProperty: WebpackEntryProperty,
    buildContext: BuildContext
): Promise<EntryPropertyObject> {
    const { dir: projectDirectory, dev: isDevMode } = buildContext;

    const newEntryProperty = typeof currentEntryProperty === 'function' ? await currentEntryProperty() : { ...currentEntryProperty };

    const clientRibbanConfigFileName = getClientRibbanConfigFile(projectDirectory);
    const filesToInject = clientRibbanConfigFileName ? [`./${clientRibbanConfigFileName}`] : [];

    for (const entryPointName in newEntryProperty) {
        if (entryPointName === 'pages/_app' || entryPointName === 'main-app') {
            addFilesToWebpackEntryPoint(newEntryProperty, entryPointName, filesToInject, isDevMode);
        }
    }

    return newEntryProperty;
}

export function getClientRibbanConfigFile(projectDirectory: string): string | void {
    const possibilites = ['ribban.client.config.ts', 'ribban.client.config.js'];

    for (const file of possibilites) {
        if (fs.existsSync(path.resolve(projectDirectory, file))) {
            return file;
        }
    }
}

function addFilesToWebpackEntryPoint(
    entryProperty: EntryPropertyObject,
    entryPointName: string,
    filesToAdd: string[],
    isDevMode: boolean
): void {
    const currentEntryPoint = entryProperty[entryPointName];
    let newEntryPoint = currentEntryPoint;

    if (typeof currentEntryPoint === 'string' || Array.isArray(currentEntryPoint)) {
        newEntryPoint = Array.isArray(currentEntryPoint) ? currentEntryPoint : [currentEntryPoint];

        if (newEntryPoint.some(entry => filesToAdd.includes(entry))) {
            return;
        }

        if (isDevMode) {
            newEntryPoint.push(...filesToAdd);
        } else {
            newEntryPoint.unshift(...filesToAdd);
        };
    } else if (typeof currentEntryPoint === 'object' && 'import' in currentEntryPoint) {
        const currentImportValue = currentEntryPoint.import;
        const newImportValue = Array.isArray(currentImportValue) ? currentImportValue : [currentImportValue];

        if (newImportValue.some(entry => filesToAdd.includes(entry))) {
            return;
        }

        if (isDevMode) {
            newImportValue.push(...filesToAdd);
        } else {
            newImportValue.unshift(...filesToAdd);
        }

        newEntryPoint = {
            ...currentEntryPoint,
            import: newImportValue
        };
    } else {
        console.error(
            'Ribban [Error]:',
            `Failed to add files to entry point '${entryPointName}', as its current value is not in a supported format.\n`,
            'Expected: string | Array<string> | { [key: string]: any, import: string | Array<string> }\n',
            `Received: ${currentEntryPoint}`
        )
    }

    entryProperty[entryPointName] = newEntryPoint;
}


function addValueInjectionLoader(
    newConfig: WebpackConfigObjectWithModuleRules,
    userNextConfig: NextConfigObject,
    userRibbanConfig: RibbanBuildOptions,
    buildContext: BuildContext
): void {

    const assetPrefix = userNextConfig.assetPrefix || userNextConfig.basePath || '';

    const isomorphicValues = {
        __ribbnaBasePath: buildContext.dev ? userNextConfig.basePath : undefined,
    };

    const serverValues = {
        ...isomorphicValues,
        __rewriteFramesDistDir__: userNextConfig.distDir?.replace(/\\/g, '\\\\') || '.next'
    };

    const clientValues = {
        ...isomorphicValues,
        __rewriteFramesAssetPrefixPath__: assetPrefix
            ? new URL(assetPrefix, 'http://dogs.are.great').pathname.replace(/\/$/, '')
            : '',
    }

    if (buildContext.isServer) {
        newConfig.module.rules.push({
            test: /(src[\\/])?instrumentation.(js|ts)/,
            use: [
                {
                    loader: path.resolve(__dirname, '..', 'src', 'config', 'loaders', 'valueInjectionLoader.ts'),
                    options: {
                        values: serverValues,
                    }
                }
            ]
        })
    } else {
        newConfig.module.rules.push({
            test: /ribban\.client\.config\.(jsx?|tsx?)/,
            use: [
                {
                    loader: path.resolve(__dirname, '..', 'src', 'config', 'loaders', 'valueInjectionLoader.ts'),
                    options: {
                        values: clientValues,
                    }
                }
            ]
        })
    }
}

function resolveNextPackageDirFromDirectory(basedir: string): string | undefined {
    try {
        return path.dirname(resolveSync('next/package.json', { basedir }));
    } catch {
        // Should not happen in theory
        return undefined;
    }
}

const POTENTIAL_REQUEST_ASYNC_STORAGE_LOCATIONS = [
    // Original location of RequestAsyncStorage
    // https://github.com/vercel/next.js/blob/46151dd68b417e7850146d00354f89930d10b43b/packages/next/src/client/components/request-async-storage.ts
    'next/dist/client/components/request-async-storage.js',
    // Introduced in Next.js 13.4.20
    // https://github.com/vercel/next.js/blob/e1bc270830f2fc2df3542d4ef4c61b916c802df3/packages/next/src/client/components/request-async-storage.external.ts
    'next/dist/client/components/request-async-storage.external.js',
];

function getRequestAsyncStorageModuleLocation(
    webpackContextDir: string,
    webpackResolvableModuleLocations: string[] | undefined,
): string | undefined {
    if (webpackResolvableModuleLocations === undefined) {
        return undefined;
    }

    const absoluteWebpackResolvableModuleLocations = webpackResolvableModuleLocations.map(loc =>
        path.resolve(webpackContextDir, loc),
    );

    for (const webpackResolvableLocation of absoluteWebpackResolvableModuleLocations) {
        const nextPackageDir = resolveNextPackageDirFromDirectory(webpackResolvableLocation);
        if (nextPackageDir) {
            const asyncLocalStorageLocation = POTENTIAL_REQUEST_ASYNC_STORAGE_LOCATIONS.find(loc =>
                fs.existsSync(path.join(nextPackageDir, '..', loc)),
            );
            if (asyncLocalStorageLocation) {
                return asyncLocalStorageLocation;
            }
        }
    }

    return undefined;
}