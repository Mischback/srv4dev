// SPDX-License-Identifier: MIT

import { lstat } from "fs/promises";
import {
  createServer,
  IncomingMessage,
  RequestListener,
  Server,
  ServerResponse,
} from "http";
import { join } from "path";

import { Srv4DevConfig } from "./configure";
import { Srv4DevError } from "./errors";
import { logger } from "./logging";

export class Srv4DevHttpError extends Srv4DevError {
  constructor(message: string) {
    super(message);
  }
}

class Srv4DevHttpRessourceNotFoundError extends Srv4DevHttpError {
  resource: string;
  constructor(unavailableResource: string) {
    super(`Ressource not found: "${unavailableResource}"`);
    this.resource = unavailableResource;
  }
}

function getHandlerStaticFiles(webRoot: string): RequestListener {
  return (
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> => {
    return new Promise((resolve) => {
      logger.debug(response);

      getRessourcePathByUrl(webRoot, request.url)
        .then(
          (ressourcePath) => {
            logger.debug(ressourcePath);
          },
          (err) => {
            logger.debug(err);
          }
        )
        .catch((err) => {
          logger.debug(err);
        })
        .finally(() => {
          return resolve();
        });
    });
  };
}

function getRessourcePathByUrl(
  webRoot: string,
  url: string | undefined
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uri = url ? url : "/";

    lstat(join(webRoot, uri))
      .then((statObject) => {
        if (statObject.isDirectory() === true)
          return resolve(
            getRessourcePathByUrl(webRoot, join(uri, "index.html"))
          );
        else return resolve(join(webRoot, uri));
      })
      .catch((err) => {
        logger.debug(err);
        return reject(
          new Srv4DevHttpRessourceNotFoundError(join(webRoot, uri))
        );
      });
  });
}

export function launchHttpServer(config: Srv4DevConfig): Promise<Server> {
  return new Promise((resolve, reject) => {
    try {
      const server = createServer(getHandlerStaticFiles(config.webRoot)).listen(
        config.httpPort,
        config.httpAddress
      );
      return resolve(server);
    } catch (err) {
      logger.debug(err);
      return reject(new Srv4DevHttpError(""));
    }
  });
}
