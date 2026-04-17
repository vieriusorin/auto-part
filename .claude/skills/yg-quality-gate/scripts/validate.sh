#!/bin/bash
# Autocare post-change validation
# Run after any code change before committing

set -e
REPO_ROOT="$(git rev-parse --show-toplevel)"

echo "Running Autocare quality gate..."
echo ""

echo "1/2 Lint check..."
cd "$REPO_ROOT" && npx nx lint tenant-ksa

echo "2/2 TypeScript check..."
cd "$REPO_ROOT" && npx tsc --noEmit -p apps/tenant-ksa/tsconfig.app.json

echo ""
echo "Quality gate passed."
