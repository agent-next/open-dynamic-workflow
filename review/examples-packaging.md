> Historical adversarial-review artifact. This is not the current vulnerability list; see `review/README.md` for context.

Here are my findings:

---

## examples-packaging — Adversarial Review

### 1. HIGH — All three examples produce `undefined` as CLI result; `export const result` is stripped but never returned

**Files:** `examples/research.js:148`, `examples/loop-until-dry.js:93`, `examples/review-changes.js:111`, `src/runner.ts:218–269`

**Root cause:** Every example ends with `export const result = { … }`. The `stripExports` function (`runner.ts:218`) removes the `export ` keyword, leaving `const result = { … }` — a local variable declaration. The body is then wrapped in an IIFE with no `return` (`runner.ts:269`):

```js
const fnSrc = "(async function(){\n" + body + "\n})";
```

Since `const result = { … }` is a statement (not a `return`), the IIFE returns `undefined`. The runner tests (`test/runner.test.ts:75`) use an explicit `return results;`, which works — showing the intended contract the examples violate.

**Confirmed by:**

```
$ node dist/cli.js examples/research.js --mock
runId: wf_444d19675811
undefined                          ← expected structured result

$ node dist/cli.js examples/loop-until-dry.js --mock
runId: wf_035ad4b6f181
undefined

$ node dist/cli.js examples/review-changes.js --mock
runId: wf_0710aeedeced
undefined
```

Programmatic confirmation:

```
$ node --input-type=module -e "
  import { runWorkflowFile } from './dist/index.js';
  import { MockBackend } from './dist/backend.js';
  import { silentReporter } from './dist/progress.js';
  for (const ex of ['examples/research.js','examples/loop-until-dry.js','examples/review-changes.js']) {
    const r = await runWorkflowFile(ex, { backend: new MockBackend(), reporter: silentReporter, journalDir: '/tmp/x' });
    console.log(ex + ': result =', JSON.stringify(r.result));
  }"
examples/research.js: result = undefined
examples/loop-until-dry.js: result = undefined
examples/review-changes.js: result = undefined
```

**Fix:** Replace `export const result = { … }` with a bare `return { … }` in each example, matching the pattern used in `test/runner.test.ts:59–76`:

```js
// Before (all 3 examples):
export const result = {
  rounds: round,
  confirmedCount: confirmed.length,
  confirmed,
};

// After:
return {
  rounds: round,
  confirmedCount: confirmed.length,
  confirmed,
};
```

---

### No other defects found

Verified items that passed:

- **All 3 examples execute to completion under MockBackend** (no crashes, all agents run, phases emit correctly).
- **loop-until-dry termination guaranteed:** `while (dry < 2 && round < MAX_ROUNDS)` with `MAX_ROUNDS = 6` — `round` increments unconditionally → at most 6 iterations. MockBackend returns identical empty items each round → terminates in 2 rounds.
- **`npm pack --dry-run`:** ships `dist/` (15 modules + types), `SPEC.md`, `ANALYSIS.md`, `LICENSE`, `README.md`, `package.json`. Correctly omits `src/`, `test/`, `traces/`, `examples/`, `build/`, `coverage/`, `tools/`.
- **`package.json` exports:** `"."` maps to `dist/index.js` (import) + `dist/index.d.ts` (types). ESM import resolves correctly. `main` matches `exports.".".import`. `types` matches `exports.".".types`.
- **`package.json` bin:** `run-workflow → dist/cli.js` — file exists and has correct `#!/usr/bin/env node` shebang.
- **`--mock` correctly overrides `ANTHROPIC_API_KEY`:** verified with `ANTHROPIC_API_KEY=fake node dist/cli.js examples/loop-until-dry.js --mock` → uses MockBackend.
- **Global injection completeness:** all 7 globals documented in example headers (`agent`, `parallel`, `pipeline`, `phase`, `log`, `args`, `budget`) are injected via `makeGlobals` (`primitives.ts:50`) and spread into the sandbox (`runner.ts:245`).
