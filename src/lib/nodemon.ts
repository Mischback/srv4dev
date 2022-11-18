// SPDX-FileCopyrightText: 2022 Mischback
// SPDX-License-Identifier: MIT
// SPDX-FileType: SOURCE

/* Library imports */
import { readFileSync } from "fs";
import nodemon from "nodemon";

/* module imports */
import { logger } from "./logging";
import { Srv4DevError } from "./errors";

export class Srv4DevNodemonError extends Srv4DevError {
  constructor(message: string) {
    super(message);
  }
}

class Srv4DevNodemonConfigError extends Srv4DevNodemonError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Read a JSON-formatted config file for nodemon.
 *
 * @param nodemonConfigFile - The file to be read
 * @returns A Promise, evaluating to a nodemon.Settings object.
 *
 * The function reads the specified file synchronously, meaning it will block
 * until the file is read into memory. As a nodemon configuration should be
 * rather small, this is not an issue.
 * Please note: There is no verification performed, the parsed JSON object is
 * simply cast as a nodemon.Settings object on return.
 */
function readNodemonConfigFile(
  nodemonConfigFile: string
): Promise<nodemon.Settings> {
  return new Promise((resolve, reject) => {
    let configContent: string;
    let config: nodemon.Settings;

    try {
      configContent = readFileSync(nodemonConfigFile, "utf-8");
    } catch (err) {
      return reject(
        new Srv4DevNodemonConfigError("Could not read config file")
      );
    }

    try {
      config = JSON.parse(configContent) as nodemon.Settings;
    } catch (err) {
      return reject(
        new Srv4DevNodemonConfigError("Could not parse config file")
      );
    }
    return resolve(config);
  });
}

/**
 * Launch nodemon with a given nodemon config file.
 *
 * @param nodemonConfigFile - The name of a configuration file to be used
 * @returns A Promise, stating that nodemon was successfully started.
 *
 * This function simply wraps around nodemon and applies a given configuration,
 * specified in nodemonConfigFile.
 * Output of this function is as minimal as possible, however, there are several
 * debug messages, if BMS is executed in debug mode.
 */
export function launchNodemon(nodemonConfigFile: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    readNodemonConfigFile(nodemonConfigFile)
      .then((config) => {
        const instance = nodemon(config);

        instance
          .on("start", () => {
            logger.debug("nodemon started with the following configuration:");
            logger.debug(config);
          })
          .on("exit", () => {
            logger.info("Build command finished!");
          })
          .on("quit", () => {
            logger.debug("nodemon stopped!");
            /* This is not really clean, the whole script is terminated here.
             * However, it *is* working just fine!
             */
            process.exit();
          })
          .on("restart", (files) => {
            logger.debug("nodemon restarted due to: ", files);
          });

        return resolve(true);
      })
      .catch((err) => {
        if (err instanceof Srv4DevNodemonConfigError) return reject(err);

        logger.debug(err);
        return reject(
          new Srv4DevNodemonError("Something went terribly wrong!")
        );
      });
  });
}
