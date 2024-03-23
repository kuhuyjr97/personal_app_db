import type { LaunchOptions } from "playwright";

export const PLAYWRIGHT_INSTANCE_NAME = "PlaywrightInstanceName";
export const PLAYWRIGHT_MODULE_OPTIONS = "PlaywrightModuleOptions";

export const DEFAULT_PLAYWRIGHT_INSTANCE_NAME = "DefaultPlaywright";

const args: LaunchOptions["args"] = [
  "--disable-gpu", // Disable GPU
  "--allow-insecure-localhost", // Enables TLS/SSL errors on localhost to be ignored (no interstitial, no blocking of requests).
];
// add --no-sandbox when running on Linux, required with --no-zygote
if (typeof process.getuid === "function") {
  args.push("--no-sandbox");
}

export const DEFAULT_CHROME_LAUNCH_OPTIONS: LaunchOptions = {
  headless: true,
  timeout: 5000,
  args,
};
