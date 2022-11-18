#!/usr/bin/env node

// SPDX-FileCopyrightText: 2022 Mischback
// SPDX-License-Identifier: MIT
// SPDX-FileType: SOURCE

import { srv4devMain } from "./main";

srv4devMain(process.argv).catch((errno: number) => {
  process.exit(errno);
});
