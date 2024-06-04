import { _optionalChain } from '@sentry/utils';
import * as fs from 'fs';
import * as path from 'path';
import 'url';
import { sync } from 'resolve';

let showedMissingGlobalErrorWarningMsg = false;

function escapeStringForRegex(regexString) {
    // escape the hyphen separately so we can also replace it with a unicode literal hyphen, to avoid the problems
    // discussed in https://github.com/sindresorhus/escape-string-regexp/issues/20.
    return regexString.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d');
}

function constructWebpackConfigFunction(
    userNextConfig = {},
    userRibbanConfig = {}
) {

    return function newWebpackFunction(
        incomingConfig,
        buildContext
    ) {
        const { isServer, dev: isDev, dir: projectDirectory } = buildContext;
        isServer ? (buildContext.nextRuntime === 'edge' ? 'edge' : 'server') : 'client';

        let rawNewConfig = { ...incomingConfig };

        if ('webpack' in userNextConfig && typeof userNextConfig.webpack === 'function') {
            rawNewConfig = userNextConfig.webpack(rawNewConfig, buildContext);
        }

        const newConfig = setUpModuleRules(rawNewConfig);

        let pagesDirPath;
        const maybePagesDirPath = path.join(projectDirectory, 'pages');
        const maybeSrcPagesDirPath = path.join(projectDirectory, 'src', 'pages');
        if (fs.existsSync(maybePagesDirPath) && fs.lstatSync(maybePagesDirPath).isDirectory()) {
            pagesDirPath = maybePagesDirPath;
        } else if (fs.existsSync(maybeSrcPagesDirPath) && fs.lstatSync(maybeSrcPagesDirPath).isDirectory()) {
            pagesDirPath = maybeSrcPagesDirPath;
        }

        let appDirPath;
        const maybeAppDirPath = path.join(projectDirectory, 'app');
        const maybeSrcAppDirPath = path.join(projectDirectory, 'src', 'app');
        if (fs.existsSync(maybeAppDirPath) && fs.lstatSync(maybeAppDirPath).isDirectory()) {
            appDirPath = maybeAppDirPath;
        } else if (fs.existsSync(maybeSrcAppDirPath) && fs.lstatSync(maybeSrcAppDirPath).isDirectory()) {
            appDirPath = maybeSrcAppDirPath;
        }

        pagesDirPath ? path.join(pagesDirPath, 'api') : undefined;

        pagesDirPath
            ? path.join(pagesDirPath, '..')
            : appDirPath
                ? path.join(appDirPath, '..')
                : projectDirectory;

        const pageExtensions = userNextConfig.pageExtensions || ['tsx', 'ts', 'jsx', 'js'];
        pageExtensions.map(ext => `.${ext}`);
        const pageExtensionRegex = pageExtensions.map(escapeStringForRegex).join('|');

        ({
            appDir: appDirPath,
            pagesDir: pagesDirPath,
            pageExtensionRegex: pageExtensionRegex,
            excludeServerRoutes: userRibbanConfig.excludeServerRoutes,
            nextjsRequestAsyncStorageModulePath: getRequestAsyncStorageModuleLocation(
                projectDirectory,
                _optionalChain([rawNewConfig, 'access', _ => _.resolve, 'optionalAccess', _2 => _2.modules]),
            ),
        });

        if (appDirPath) {
            const hasGlobalErrorFile = ['global-error.js', 'global-error.ts', 'global-error.jsx', 'global-error.tsx'].some(
                file => fs.existsSync(path.join(appDirPath, file)),
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

function setUpModuleRules(newConfig) {
    newConfig.module = {
        ...newConfig.module,
        rules: [...(_optionalChain([newConfig, 'access', _3 => _3.module, 'optionalAccess', _4 => _4.rules]) || [])],
    };
    // Surprising that we have to assert the type here, since we've demonstrably guaranteed the existence of
    // `newConfig.module.rules` just above, but ¯\_(ツ)_/¯
    return newConfig ;
}

async function addRibbanToClientEntryPoint(
    currentEntryProperty,
    buildContext
) {
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

function getClientRibbanConfigFile(projectDirectory) {
    const possibilites = ['ribban.client.config.ts', 'ribban.client.config.js'];

    for (const file of possibilites) {
        if (fs.existsSync(path.resolve(projectDirectory, file))) {
            return file;
        }
    }
}

function addFilesToWebpackEntryPoint(
    entryProperty,
    entryPointName,
    filesToAdd,
    isDevMode
) {
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
        }    } else if (typeof currentEntryPoint === 'object' && 'import' in currentEntryPoint) {
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
        );
    }

    entryProperty[entryPointName] = newEntryPoint;
}

function resolveNextPackageDirFromDirectory(basedir) {
    try {
        return path.dirname(sync('next/package.json', { basedir }));
    } catch (e) {
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
    webpackContextDir,
    webpackResolvableModuleLocations,
) {
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

export { constructWebpackConfigFunction, escapeStringForRegex, getClientRibbanConfigFile };
//# sourceMappingURL=webpack.js.map
