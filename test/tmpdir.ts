import { afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Temp dirs made by the importing test file. Vitest isolates each test file, so this list and the
// hook below are per file; the hook registers at import time on that file's root suite.
const created: string[] = [];
afterEach(() => {
  for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** mkdtemp under the OS temp dir, recorded so it is removed after the current test. */
export function makeTmpDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  created.push(dir);
  return dir;
}
