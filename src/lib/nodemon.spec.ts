// SPDX-License-Identifier: MIT

/* test specific imports */
import { beforeAll, describe, expect, it, jest } from "@jest/globals";
// import { mocked } from "ts-jest/utils";

jest.mock("nodemon");
jest.mock("fs");

// import nodemon from "nodemon";
import { readFileSync } from "fs";

// import nodemon from "nodemon";
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

// describe("launchNodemon()...", () => {
//   it("...launches nodemon", () => {
//     (readFileSync as jest.Mock).mockReturnValue("");
//     JSON.parse = jest.fn(() => {
//       return {
//         exec: "pwd",
//         ext: "ts",
//         verbose: true,
//         watch: ["src"],
//       };
//     });
//     // (nodemon as any as jest.Mock).mockImplementation(() => {
//     //   console.log("foobar");
//     //   return nodemon; });
//     // console.log(nodemon);
//     const mockedNodemon = mocked(nodemon, true);
//     const nodemonOnSpy = jest.spyOn(nodemon, "on");

//     /* despite of all the mocking in place, the test is actually still totally
//      * fucked up.
//      * Because of mocking "nodemon", the attached "on"-handlers can not be
//      * called and throw another error in nodemon.ts.
//      * However, the "catch()"-block verifies, that "nodemon" is actually called.
//      */
//     return launchNodemon("foo")
//       .then((retVal) => {
//         expect(retVal).toBe(true);
//         expect(mockedNodemon).toHaveBeenCalled();
//         expect(nodemonOnSpy).toBeCalledTimes(4);
//       })
//       .catch((err) => {
//         expect(mockedNodemon).toHaveBeenCalledTimes(1);
//         expect(err).toBeInstanceOf(Srv4DevNodemonError);
//         // expect(nodemonOnSpy).toThrow();
//       });
//   });
// });
