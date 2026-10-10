.PHONY: setup check

# Install dependencies exactly as CI does (package-lock.json is committed).
setup:
	npm ci

# Mirrors .github/workflows/ci.yml: typecheck, build, offline unit tests,
# then the two fidelity gates (OURS vs CLAUDE traces; journal cross-check).
check:
	npm run typecheck
	npm run build
	npm test
	node tools/compare.mjs
	node tools/crosscheck.mjs
