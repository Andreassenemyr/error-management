import { BrowserOptions } from "../types";

export function withRibbanConfig<T>(exportedUserNextConfig: T): T {
  return exportedUserNextConfig;
}

export function init(options: BrowserOptions) {
    console.log("Hej hej");
};