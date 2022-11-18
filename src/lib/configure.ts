// SPDX-FileCopyrightText: 2022 Mischback
// SPDX-License-Identifier: MIT
// SPDX-FileType: SOURCE

import { getopt } from "stdio";
import { Config } from "stdio/dist/getopt";

import { Srv4DevError } from "./errors";
import { logger } from "./logging";

export interface Srv4DevConfig {
  httpAddress: string;
  httpPort: number;
  webRoot: string;
  nodemonConfigFile: string;
}

/**
 * This constant defines the accepted command line options as required
 * by stdio.getopt().
 * @see getopt
 * @see getConfig
 */
export const cmdLineOptions: Config = {
  address: {
    args: 1,
    default: false,
    description: "The address to bind the server to",
    key: "a",
    required: false,
  },
  debug: {
    args: 0,
    default: false,
    description: "Flag to activate debug mode",
    key: "d",
    required: false,
  },
  nodemonConfig: {
    args: 1,
    default: false,
    description: "Config file for nodemon",
    key: "c",
    required: false,
  },
  port: {
    args: 1,
    default: false,
    description: "The port to bind the server to",
    key: "p",
    required: false,
  },
  quiet: {
    args: 0,
    default: false,
    description: "Disable all logging messages",
    key: "q",
    required: false,
  },
  webRoot: {
    args: 1,
    default: false,
    description: "Serve files from this directory as root",
    key: "w",
    required: false,
  },
};

export class Srv4DevConfigureError extends Srv4DevError {
  constructor(message: string) {
    super(message);
  }
}

export function getConfig(argv: string[]): Promise<Srv4DevConfig> {
  return new Promise((resolve, reject) => {
    /* Parse the command line arguments into actual usable parameters. */
    const cmdLineParams = getopt(cmdLineOptions, argv);

    /* This is not covered by unittests.
     * During manual testing, I could not reproduce this condition, because
     * getopt() will actually terminate the process on errors.
     * However, let's keep this here as a first line of defense.
     */
    if (cmdLineParams === null)
      return reject(
        new Srv4DevConfigureError("Could not parse command line parameters")
      );

    let tmpAddress: string;
    if (cmdLineParams.address === false) {
      tmpAddress = "127.0.0.1";
      logger.info(`No address specified, using "${tmpAddress}"`);
    } else {
      tmpAddress = cmdLineParams.address as string;
      logger.debug(`Address: "${tmpAddress}"`);
    }

    let tmpNodemonConfigFile: string;
    if (cmdLineParams.nodemonConfig === false) {
      tmpNodemonConfigFile = "nodemon.json";
      logger.info(
        `No nodemon config file specified, using "${tmpNodemonConfigFile}"`
      );
    } else {
      tmpNodemonConfigFile = cmdLineParams.nodemonConfig as string;
      logger.debug(`Nodemon config: "${tmpNodemonConfigFile}"`);
    }

    let tmpPort: number;
    if (cmdLineParams.port === false) {
      tmpPort = 8000;
      logger.info(`No port specified, using "${tmpPort}"`);
    } else {
      try {
        tmpPort = parseInt(cmdLineParams.port as string);
      } catch (err) {
        tmpPort = 8000;
        logger.warn(
          `Could not parse port as provided by command line: "${
            cmdLineParams.port as string
          }"`
        );
        logger.warn(`Using default port: "${tmpPort}"`);
      }
      logger.debug(`Port: "${tmpPort}"`);
    }

    let tmpWebRoot: string;
    if (cmdLineParams.webRoot === false) {
      tmpWebRoot = "./";
      logger.info(`No webRoot specified, using "${tmpWebRoot}"`);
    } else {
      tmpWebRoot = cmdLineParams.webRoot as string;
      logger.debug(`WebRoot: "${tmpWebRoot}"`);
    }

    return resolve({
      httpAddress: tmpAddress,
      httpPort: tmpPort,
      webRoot: tmpWebRoot,
      nodemonConfigFile: tmpNodemonConfigFile,
    } as Srv4DevConfig);
  });
}
