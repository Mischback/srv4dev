// SPDX-License-Identifier: MIT

/* test specific imports */
import { beforeAll, describe, expect, it, jest } from "@jest/globals";

/* mock library imports */
jest.mock("http");
jest.mock("fs/promises");

/* import the subject under test (SUT) */
import {
  getHandlerStaticFiles,
  launchHttpServer,
  Srv4DevHttpError,
} from "./http";

/* additional imports */
import { lstat } from "fs/promises";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { join } from "path";
import { logger } from "./logging";
import { Srv4DevConfig } from "./configure";

/* Run these before actually starting the test suite */
beforeAll(() => {
  /* The test subject relies on "tslog" to provide log messages.
   * For running the test-suite, actually printing the log messages to the
   * console is unwanted, so the output is suppressed.
   */
  logger.setSettings({
    suppressStdOutput: true,
  });
});

describe("launchHttpServer()...", () => {
  it("...creates the server and binds to specified address and port", () => {
    const testAddress = "localhost";
    const testPort = 8000;
    const testConfiguration: Srv4DevConfig = {
      httpAddress: testAddress,
      httpPort: testPort,
      webRoot: "./test/",
    };
    /* setup mocks and spies */
    const mockListen = jest.fn();
    (createServer as jest.Mock).mockReturnValue({
      listen: mockListen,
    });

    return launchHttpServer(testConfiguration).then(() => {
      expect(createServer).toHaveBeenCalledTimes(1);
      expect(createServer).toHaveBeenCalledWith(expect.anything());
      expect(mockListen).toHaveBeenCalledTimes(1);
      expect(mockListen).toHaveBeenCalledWith(testPort, testAddress);
    });
  });

  it("...fails if createServer() fails", () => {
    /* setup mocks and spies */
    (createServer as jest.Mock).mockImplementation(() => {
      throw new Error("testError");
    });

    return launchHttpServer({} as Srv4DevConfig).catch((err) => {
      expect(err).toBeInstanceOf(Srv4DevHttpError);
    });
  });

  it("...fails if listen() fails", () => {
    /* setup mocks and spies */
    const mockListen = jest.fn().mockImplementation(() => {
      throw new Error("testError");
    });
    (createServer as jest.Mock).mockReturnValue({
      listen: mockListen,
    });

    return launchHttpServer({} as Srv4DevConfig).catch((err) => {
      expect(err).toBeInstanceOf(Srv4DevHttpError);
    });
  });
});

describe("getHandlerStaticFiles()...", () => {
  it("...returns something truthy", () => {
    expect(getHandlerStaticFiles("foobar")).toBeTruthy();
  });

  it("...getResourcePathByUrl() rejects with error if resource is not found", async () => {
    const testUrl = "/testing/";
    const testWebRoot = "webRoot";

    const expectedResource = join(testWebRoot, testUrl);

    /* setup mocks and spies */
    (lstat as jest.Mock).mockRejectedValue("MOCK lstat()");
    const mockRequest = {
      url: testUrl,
    } as IncomingMessage;
    const mockResponse = {
      end: jest.fn(),
      write: jest.fn(),
      writeHead: jest.fn(),
    } as any as ServerResponse;

    const handler = getHandlerStaticFiles(testWebRoot);

    // eslint-disable-next-line @typescript-eslint/await-thenable
    const retVal = await handler(mockRequest, mockResponse);
    expect(retVal).toBe(undefined);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockResponse.writeHead).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockResponse.write).toHaveBeenCalledWith(`${expectedResource}\n`);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockResponse.end).toHaveBeenCalledTimes(1);
  });
});
