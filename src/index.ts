#!/usr/bin/env node

// SPDX-License-Identifier: MIT

import { srv4devMain } from "./main";

srv4devMain(process.argv)
  .then((retVal) => {
    process.exit(retVal);
  })
  .catch((errno: number) => {
    process.exit(errno);
  });
