#!/usr/bin/env node
import { run } from './cli/router.js';

run(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err) => {
    process.stderr.write(`Error: ${(err as Error)?.message ?? String(err)}\n`);
    process.exitCode = 2;
  });
