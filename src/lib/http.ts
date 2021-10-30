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

interface Srv4DevHttpResponse {
  status: number;
  resource: string;
}

export class Srv4DevHttpError extends Srv4DevError {
  constructor(message: string) {
    super(message);
  }
}

class Srv4DevHttpResourceNotFoundError extends Srv4DevHttpError {
  resource: string;
  constructor(unavailableResource: string) {
    super(`Ressource not found: "${unavailableResource}"`);
    this.resource = unavailableResource;
  }
}

function createResponseRessourceNotFound(
  response: ServerResponse,
  resourcePath: string
): Promise<Srv4DevHttpResponse> {
  return new Promise((resolve) => {
    response.writeHead(404, { "Content-Type": "text/plain" });
    response.write("Not Found!\n\n");
    response.write(`${resourcePath}\n`);
    response.end();

    return resolve({
      status: 404,
      resource: resourcePath,
    } as Srv4DevHttpResponse);
  });
}

function getHandlerStaticFiles(webRoot: string): RequestListener {
  return (
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> => {
    return new Promise((resolve) => {
      getResourcePathByUrl(webRoot, request.url)
        .then(
          (resourcePath) => {
            logger.debug(resourcePath);
          },
          (err) => {
            if (err instanceof Srv4DevHttpResourceNotFoundError)
              return createResponseRessourceNotFound(response, err.resource);
            throw err;
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

function getResourcePathByUrl(
  webRoot: string,
  url: string | undefined
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uri = url ? url : "/";

    lstat(join(webRoot, uri))
      .then((statObject) => {
        if (statObject.isDirectory() === true)
          return resolve(
            getResourcePathByUrl(webRoot, join(uri, "index.html"))
          );
        else return resolve(join(webRoot, uri));
      })
      .catch((err) => {
        logger.debug(err);
        return reject(new Srv4DevHttpResourceNotFoundError(join(webRoot, uri)));
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
