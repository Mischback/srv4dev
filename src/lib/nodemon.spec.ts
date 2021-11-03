// SPDX-License-Identifier: MIT

/* test specific imports */
import { beforeAll, describe, expect, it, jest } from "@jest/globals";

jest.mock("nodemon");
jest.mock("fs");

import { readFileSync } from "fs";

import { launchNodemon, Srv4DevNodemonError } from "./nodemon";

import { logger } from "./logging";

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

describe("readNodemonConfigFile()...", () => {
  it("...should raise an error if the config file could not be read", () => {
    /* setup mocks and spies */
    (readFileSync as jest.Mock).mockImplementation(
      (
        _filename: string,
        _options:
          | {
              encoding: BufferEncoding;
              flag?: string | undefined;
            }
          | BufferEncoding
      ) => {
        throw "MOCKED readFileSync()";
      }
    );

    const testFilename = "testing";

    expect.assertions(3);
    return launchNodemon(testFilename).catch((err) => {
      expect(err).toBeInstanceOf(Srv4DevNodemonError);
      /* readFileSync is actually called one more time than our own code
       * does. Seems to be an implementation detail. */
      expect(readFileSync).toHaveBeenCalledTimes(1);
      expect(readFileSync).toHaveBeenCalledWith(testFilename, "utf-8");
    });
  });

  it("...should raise an error, if the config file could not be parsed", () => {
    /* setup mocks and spies */
    (readFileSync as jest.Mock).mockImplementation(
      (
        _filename: string,
        _options:
          | {
              encoding: BufferEncoding;
              flag?: string | undefined;
            }
          | BufferEncoding
      ) => {
        return "{";
      }
    );
    const JSONparseSpy = jest.spyOn(JSON, "parse");

    const testFilename = "testing";

    expect.assertions(4);
    return launchNodemon(testFilename).catch((err) => {
      expect(err).toBeInstanceOf(Srv4DevNodemonError);
      /* readFileSync is actually called one more time than our own code
       * does. Seems to be an implementation detail. */
      expect(readFileSync).toHaveBeenCalledTimes(1);
      expect(readFileSync).toHaveBeenCalledWith(testFilename, "utf-8");
      expect(JSONparseSpy).toHaveBeenCalledTimes(1);
    });
  });
});
