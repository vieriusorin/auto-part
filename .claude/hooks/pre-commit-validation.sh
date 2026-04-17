#!/bin/bash

# Autocare Pre-Commit Validation Hook
# This hook prevents committing sensitive data and ensures code quality

set -e

echo "🔍 Running pre-commit validations..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Check for sensitive files
echo "🔐 Checking for sensitive files..."
SENSITIVE_PATTERNS=(
  "\.env$"
  "\.env\.local$"
  "\.env\.production$"
  "\.env\.development$"
  "credentials\.json$"
  "secrets\.json$"
  "\.pem$"
  "\.key$"
  "\.cert$"
  "id_rsa"
  "id_dsa"
)

SENSITIVE_FOUND=false
for file in $STAGED_FILES; do
  for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if echo "$file" | grep -qE "$pattern"; then
      echo -e "${RED}❌ BLOCKED: Attempting to commit sensitive file: $file${NC}"
      SENSITIVE_FOUND=true
    fi
  done
done

if [ "$SENSITIVE_FOUND" = true ]; then
  echo -e "${RED}❌ Commit blocked due to sensitive files. Remove them from staging.${NC}"
  exit 1
fi

# Check for sensitive data in files
echo "🔍 Checking for sensitive data patterns..."
SENSITIVE_DATA_PATTERNS=(
  "API_KEY.*=.*[A-Za-z0-9]{20,}"
  "SECRET.*=.*[A-Za-z0-9]{20,}"
  "PASSWORD.*=.*[A-Za-z0-9]{8,}"
  "TOKEN.*=.*[A-Za-z0-9]{20,}"
  "-----BEGIN PRIVATE KEY-----"
  "-----BEGIN RSA PRIVATE KEY-----"
)

SENSITIVE_DATA_FOUND=false
for file in $STAGED_FILES; do
  if [ -f "$file" ]; then
    for pattern in "${SENSITIVE_DATA_PATTERNS[@]}"; do
      if grep -qE "$pattern" "$file"; then
        echo -e "${RED}❌ BLOCKED: Sensitive data pattern found in: $file${NC}"
        echo -e "${YELLOW}   Pattern: $pattern${NC}"
        SENSITIVE_DATA_FOUND=true
      fi
    done
  fi
done

if [ "$SENSITIVE_DATA_FOUND" = true ]; then
  echo -e "${RED}❌ Commit blocked due to sensitive data in files.${NC}"
  exit 1
fi

# Check for console.log statements in production code
echo "🔍 Checking for console.log statements..."
CONSOLE_LOG_FOUND=false
for file in $STAGED_FILES; do
  if [[ $file == *.tsx ]] || [[ $file == *.ts ]]; then
    if [ -f "$file" ] && grep -qE "console\.(log|warn|error)\(" "$file"; then
      echo -e "${YELLOW}⚠️  Warning: console.log found in: $file${NC}"
      # Don't block, just warn
    fi
  fi
done

# Run lint on staged files
echo "🧹 Running ESLint on staged files..."
TS_FILES=$(echo "$STAGED_FILES" | grep -E '\.(ts|tsx)$' || true)

if [ -n "$TS_FILES" ]; then
  if npx nx lint tenant-ksa; then
    echo -e "${GREEN}✅ ESLint passed${NC}"
  else
    echo -e "${RED}❌ ESLint failed. Fix errors before committing.${NC}"
    exit 1
  fi
fi

# Check TypeScript types
echo "🔍 Checking TypeScript types..."
if npx tsc --noEmit -p apps/tenant-ksa/tsconfig.app.json; then
  echo -e "${GREEN}✅ TypeScript check passed${NC}"
else
  echo -e "${RED}❌ TypeScript errors found. Fix before committing.${NC}"
  exit 1
fi

# Check for TODO comments in staged files
echo "🔍 Checking for TODO comments..."
TODO_FOUND=false
for file in $STAGED_FILES; do
  if [ -f "$file" ] && grep -qE "// TODO|// FIXME" "$file"; then
    echo -e "${YELLOW}⚠️  TODO/FIXME found in: $file${NC}"
    # Don't block, just warn
  fi
done

# Success
echo -e "${GREEN}✅ All validations passed! Ready to commit.${NC}"
exit 0
