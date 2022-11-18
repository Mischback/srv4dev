// SPDX-FileCopyrightText: 2022 Mischback
// SPDX-License-Identifier: MIT
// SPDX-FileType: SOURCE

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

/**
 * Lookup table to determine the mime type by file extension
 *
 * @see {@link createResponseOk}
 */
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

/**
 * Provide a HTTP 200 response
 *
 * @param response - The {@link ServerResponse} object to write to
 * @param resourcePath - The resource as determined by {@link getResourcePathByUrl}
 * @returns A Promise, resolving to an instance of {@link Srv4DevHttpResponse}
 *
 * The function determines the correct MIME type by evaluating the file extension
 * by the lookup table in {@link mimeTypes} and then uses {@link createReadStream} to
 * actually open the file.
 * If there is an error during file streaming, the Promise is rejected with an
 * instance of {@link Srv4DevHttpFileError}.
 */
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

/**
 * Provide a HTTP 404 response
 *
 * @param response - The {@link ServerResponse} object to write to
 * @param resourcePath - The resource as determined by {@link getResourcePathByUrl}
 * @returns A Promise, resolving to an instance of {@link Srv4DevHttpResponse}
 *
 * The function provides the complete HTTP-conform response, including headers.
 */
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

/**
 * Provide a node/http-conform {@link RequestListener} with its internal logic
 *
 * @param webRoot - The root to serve from
 * @returns A {@link RequestListener}
 *
 * The returned function provides the logic to handle the requests to a static,
 * file system based resource.
 * 1) Determine the resource
 * 2) Provide 200/404 http response
 * 3) Log the operation
 */
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

/**
 * Determine the filesystem resource as specified by requested URL
 *
 * @param webRoot - The directory to be used as root for the server
 * @param url - The requested URL
 * @returns A Promise, resolving to the path/filename of the requested resource
 *
 * The function tries to access the requested resource relative to the specified
 * "webRoot". If it is accessible, the path/filename are returned.
 * If the identified resource is a directory, the function is called recursively
 * with an appended "index.html".
 * If the resource can not be accessed, a {@link Srv4DevHttpResourceNotFoundError}
 * is returned / rejected.
 */
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

/**
 * Launch the http server on a given address and port.
 *
 * @param config - The {@link Srv4DevConfig} item
 * @returns A Promise, resolving to the {@link Server} instance
 */
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
