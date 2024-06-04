import { NextConfigObject, RibbanBuildOptions, WebpackConfigFunction } from "./types";
export declare function escapeStringForRegex(regexString: string): string;
export declare function constructWebpackConfigFunction(userNextConfig?: NextConfigObject, userRibbanConfig?: RibbanBuildOptions): WebpackConfigFunction;
export declare function getClientRibbanConfigFile(projectDirectory: string): string | void;
//# sourceMappingURL=webpack.d.ts.map