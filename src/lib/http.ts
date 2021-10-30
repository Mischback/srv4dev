// SPDX-License-Identifier: MIT

import { createServer, Server } from "http";

import { Srv4DevConfig } from "./configure";
import { Srv4DevError } from "./errors";
import { logger } from "./logging";

export class Srv4DevHttpError extends Srv4DevError {
  constructor(message: string) {
    super(message);
  }
}

export function launchHttpServer(config: Srv4DevConfig): Promise<Server> {
  return new Promise((resolve, reject) => {
    try {
      const server = createServer().listen(config.httpPort, config.httpAddress);
      return resolve(server);
    } catch (err) {
      logger.debug(err);
      return reject(new Srv4DevHttpError(""));
    }
  });
}
