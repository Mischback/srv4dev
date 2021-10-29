// SPDX-License-Identifier: MIT

import { Config } from "stdio/dist/getopt";

import { cmdLineOptions } from "./lib/configure";
import {
  applyDebugConfiguration,
  logger,
  suppressLogOutput,
} from "./lib/logging";

/* *** INTERNAL CONSTANTS *** */
const EXIT_SUCCESS = 0; // sysexits.h: 0 -> successful termination
const EXIT_SIGINT = 130; // bash scripting guide: 130 -> terminated by ctrl-c

/* *** TYPE DEFINITIONS *** */
type StdioConfigItem = Exclude<Config, boolean | undefined>;

export function srv4devMain(argv: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    /* Setting up a handler for SIGINT (Ctrl-C)
     * This handler may be useful for cleaning up before terminating the script.
     * At least it will resolve to the "correct" exit code.
     */
    process.on("SIGINT", () => {
      logger.info("Caught interrupt signal (Ctrl-C). Exiting!");
      return reject(EXIT_SIGINT);
    });

    /* Activate the quiet mode as early as possible
     * This is done without getopt() from stdio, because getopt() will be called
     * later during startup.
     * Please note: if quiet mode and debug mode are activated, debug mode wins.
     */
    const quietKey = (cmdLineOptions.quiet as StdioConfigItem)["key"];
    if (argv.indexOf(`-${quietKey as string}`) > -1) {
      suppressLogOutput();
    }

    /* Activate the debug mode as early as possible
     * This is done without getopt() from stdio, because getopt() will be called
     * later during startup.
     */
    const debugKey = (cmdLineOptions.debug as StdioConfigItem)["key"];
    if (argv.indexOf(`-${debugKey as string}`) > -1) {
      applyDebugConfiguration();
    }

    logger.debug(argv);
    return resolve(EXIT_SUCCESS);
  });
}
