# AGENTS.md

Repo guide for agents (and humans). Org standard: [agent-next agent standard](https://github.com/agent-next/.github/blob/main/AGENT-STANDARD.md).

## Purpose
Open TypeScript engine reproducing Claude Code's dynamic workflows — `agent` / `parallel` / `pipeline` / `phase` scripts with structured output, journal-based resume, and a concurrency cap — with pluggable agent backends (Mock, Anthropic API, local CLI agents, HTTP). Published as the npm package `open-dynamic-workflow`; behavior is pinned to captured real-harness traces by a differential fidelity gate.

## Orient
- `src/` — the engine. `primitives.ts` is the script API, `runner.ts` executes it, `journal.ts` powers resume, `concurrency.ts` the cap. Backends: `backend.ts` (Mock/Anthropic), `cli-agent-backend.ts` (local agents), `http-agent-backend.ts` (cloud), `pool-*.ts` (agent pool).
- `test/` — 23 vitest files (242 tests), fully offline via `MockBackend`; no network or API keys needed.
- `traces/` — ground-truth logs from real Claude Code runs plus probe experiments. Inputs to the fidelity gates; treat as read-only data.
- `tools/` — `compare.mjs` (1:1 gate OURS vs CLAUDE traces, 34/34), `crosscheck.mjs` (journal/resume), `live-e2e.mjs` (real agents; needs local CLIs).
- `examples/` — plain-JS workflow scripts; run offline with `node dist/cli.js <file> --mock`.
- `SPEC.md`, `docs/PARITY.md` — primitive mapping and the honest parity/deviation matrix.

## Setup
Node >= 20 only (verified on 22.x); no other prerequisites.

    npm ci

or `make setup`.

## Check
`make check` mirrors CI exactly:

    npm run typecheck   # tsc --noEmit
    npm run build       # tsc -p tsconfig.build.json -> dist/
    npm test            # vitest run (offline)
    node tools/compare.mjs    # fidelity gate, must stay 34/34
    node tools/crosscheck.mjs # journal/resume cross-check

Everything must pass; there are no currently-failing tests.

## Boundaries
- Fidelity is the product: engine changes that alter observable behavior must keep `compare.mjs` at 34/34 or update the gate with new trace evidence — never weaken assertions to pass.
- Don't edit anything under `traces/`; it is measured data, not code.
- Known, documented deviations (budget run-scoped vs turn-global, hash preimage, token estimates) are listed in `docs/PARITY.md` — keep that file honest rather than "fixing" claims in docs.
- The `vm` script runtime reproduces an API shape, not a security boundary — see `SECURITY.md`; run only trusted workflow source.
- CI lives in `.github/workflows/ci.yml`; wrap it via the Makefile, don't duplicate or rewrite it.

## Done
`make setup` then `make check` both succeed from a clean checkout, all 242 tests pass, and the gate reports 34/34. PR body includes the real command output as receipts.
