#!/usr/bin/env node

import { runCli } from "../server/cli.mjs";

await runCli({ argumentsList: process.argv.slice(2) });
