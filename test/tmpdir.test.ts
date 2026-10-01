import { describe, it, expect } from "vitest";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeTmpDir } from "./tmpdir.js";

describe("makeTmpDir", () => {
  let made = "";

  it("creates a fresh dir under the OS temp dir", () => {
    made = makeTmpDir("odw-tmpdir-");
    expect(existsSync(made)).toBe(true);
    writeFileSync(join(made, "f.txt"), "x"); // non-empty, so removal must be recursive
  });

  it("removes it once the test that made it finishes", () => {
    expect(made).not.toBe("");
    expect(existsSync(made)).toBe(false);
  });
});
