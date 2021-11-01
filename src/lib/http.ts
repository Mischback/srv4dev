// SPDX-License-Identifier: MIT

import { createReadStream } from "fs";
import { lstat } from "fs/promises";
import {
  createServer,
  IncomingMessage,
  RequestListener,
  Server,
  ServerResponse,
} from "http";
import { extname, join } from "path";

import { Srv4DevConfig } from "./configure";
import { Srv4DevError } from "./errors";
import { logger } from "./logging";

interface Srv4DevHttpResponse {
  status: number;
  resource: string;
}

const mimeTypes: { [id: string]: string } = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".gif": "image/gif",
  ".jpeg": "image/jpg",
  ".jpg": "image/jpg",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".tiff": "image/tiff",
  ".webp": "image/webp",
};

export class Srv4DevHttpError extends Srv4DevError {
  constructor(message: string) {
    super(message);
  }
}

class Srv4DevHttpFileError extends Srv4DevHttpError {
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

function createResponseOk(
  response: ServerResponse,
  resourcePath: string
): Promise<Srv4DevHttpResponse> {
  return new Promise((resolve, reject) => {
    const mime = mimeTypes[extname(resourcePath)] || "application/octet-stream";

    const fileStream = createReadStream(resourcePath);

    fileStream.on("start", () => {
      response.writeHead(200, { "Content-Type": mime });
    });
    fileStream.on("data", (chunk: any) => {
      response.write(chunk);
    });
    fileStream.on("end", () => {
      response.end();
    });
    fileStream.on("error", () => {
      return reject(
        new Srv4DevHttpFileError(`Error while reading "${resourcePath}"`)
      );
    });

    return resolve({
      status: 200,
      resource: resourcePath,
    } as Srv4DevHttpResponse);
  });
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

export function getHandlerStaticFiles(webRoot: string): RequestListener {
  return (
    request: IncomingMessage,
    response: ServerResponse
  ): Promise<void> => {
    return new Promise((resolve) => {
      getResourcePathByUrl(webRoot, request.url)
        .then(
          (resourcePath) => {
            return createResponseOk(response, resourcePath);
          },
          (err) => {
            if (err instanceof Srv4DevHttpResourceNotFoundError)
              return createResponseRessourceNotFound(response, err.resource);
            throw err;
          }
        )
        .then((response) => {
          logger.info(`${response.status.toString()}: ${response.resource}`);
        })
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
      .catch(() => {
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
